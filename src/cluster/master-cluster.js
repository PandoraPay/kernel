import cluster from 'src/cluster/cluster';

import ClientsCluster from "./clients/clients-cluster"
import StringHelper from "src/helpers/string-helper";

import Helper from "src/helpers/helper"
import Exception from "../helpers/exception";

import AsyncEvents from "async-events";
import BufferHelper from "../helpers/buffers/buffer-helper";

const ServerCluster = BROWSER ? undefined : require( "./server/server-cluster" ).default;

/**
 * scope
 *          argv, logger, db, httpServer, httpServerClass
 */

export default class MasterCluster extends AsyncEvents {

    constructor(scope, applyConstructor = true){

        super();

        this._startedStatus = false;

        this.isMaster = undefined;
        this.isMasterCluster = undefined;
        this.isWorker = undefined;
        this.workerId = undefined;
        this.workerName = undefined;
        this.clientsCluster = undefined;
        this.serverCluster = undefined;

        if (applyConstructor)
            this._constructor(scope);


    }

    _constructor(scope){

        //default scope arguments
        this._scope = scope = {
            ClientsCluster: ClientsCluster,
            ServerCluster: ServerCluster,
            ...scope,
            masterCluster:this,
        };


        //setting the clusters for clients and server
        this.clientsCluster = scope.clientsCluster;
        this.serverCluster = scope.serverCluster;

        if (!this.clientsCluster && new scope.ClientsCluster )
            this.clientsCluster = new scope.ClientsCluster ({
                ...this._scope,
                masterCluster: this,
            });

        if (!this.serverCluster && scope.ServerCluster )
            this.serverCluster = new scope.ServerCluster ({
                ...this._scope,
                masterCluster: this,
            });

    }

    async start(){

        if (this._startedStatus) return true;

        await this._started();

        await this._scope.events.emit("master-cluster/started", this );
        this._startedStatus = true;

    }

    async _started(){

        const isMaster = cluster.isMaster;

        this.isMasterCluster = isMaster;
        this.isMaster = isMaster;
        this.isWorker = !isMaster;

        const workerId = isMaster ? 'master' : Number.parseInt( process.env.SLAVE_INDEX);

        this.workerName = isMaster ? "master" : "worker" + workerId;
        this.workerId = workerId;


        if ( isMaster )
            await this._scope.db.client.lockDeleteAll();

        this._scope.masterCluster = this;
        this._scope.app._scope.masterCluster = this;

        await this._scope.events.emit("master-cluster/initialized", this);

        if (this.clientsCluster)
            await this.clientsCluster.init();

        let initializePromise;

        if (this.serverCluster){

            /**
             * Creating instances
             */

            const out  = await this.serverCluster.start();

            /**
             * After instance was created, but not yet initialized
             */

            if (!out)
                this._scope.logger.info( this, "Master Server couldn't be created");
            else {

                this.stickyMaster = isMaster ? out.stickyOut.res : undefined;

                if (isMaster){

                    /**
                     * Master
                     */

                    this.locks = {

                    };

                    this.stickyMaster.events.on("message", data =>  this.receivedData( data.worker, data.msg, data.data ) );

                    /**
                     * waiting for receving all hello
                     */

                    initializePromise = new Promise( resolve =>{

                        const done = { };
                        let count = 0, broadcasted = false;

                        this._statusOn = this.on("ready-worker!", async data =>{

                            if (!data.result) return;

                            //should take workers into

                            if (!done[data._worker.index]) {
                                done[data._worker.index] = 0;
                                count++;
                            }

                            done[data._worker.index]++;

                            if (count === this.stickyMaster.workers.length  ) {

                                if (!broadcasted) {
                                    broadcasted = true;
                                    await this.sendReadyMaster( true );
                                    resolve(true);
                                } else {
                                    await this.sendReadyMaster( data._worker);
                                }

                            }

                        });

                    });


                } else {


                    /**
                     * Worker aka Slave
                     */

                    process.on("message", data => this.receivedData( process, data.msg, data.data ) );

                }



                this._scope.logger.info( this, `Instance created ${this.workerName}`);

            }

        }


        if (this.clientsCluster)
            await this.clientsCluster.start();

        await Helper.promiseTimeout( initializePromise, 60*1000 );

        if (this.isWorker)
            await this.sendReadyWorker();

    }

    lockSet({lockName, lockTime}, worker){

        if (!this.locks[lockName]) {

            this.locks[lockName] = {
                time: lockTime,
                timeout: lockTime ? setTimeout( ()=> delete this.locks[lockName], lockTime) : undefined,
            };

            return { result : true};

        }

        return {result: false};

    }

    lockDelete( {lockName}, worker){


        if (this.locks[lockName]){

            clearTimeout( this.locks[ lockName ].timeout );
            delete this.locks[ lockName ];

            return {result: true};
        }

        return {result: false};

    }

    async receivedData(worker, message, data){

        if (message === "confirmation"){

            try{
                const cb = this["__promiseResolve"+data.confirmation];
                await cb(data.output);
            }catch(err){
                if (this._scope.argv.debug.enabled)
                    this._scope.logger.error(this, "receivedData raised an error", err);
            }
            delete this["__promiseResolve"+data.confirmation];
            return;

        }

        data = BufferHelper.processBufferArray(data);

        if ( this.isMaster ) { //master

            /**
             * It requires to propagate the message to all other workers
             */
            if ( data.broadcast) {

                delete data.broadcast;

                const promises = [];

                for (const work of this.stickyMaster.workers)
                    if (work) {

                        if (worker._closed) continue; //closed already

                        const confirmation = StringHelper.generateRandomId(32 );
                        const promise = new Promise( resolve => this["__promiseResolve" + confirmation ] = resolve );
                        promises.push( promise );

                        work.send({msg: message, data: { ... data, confirmation}, });
                    }

                await promises;

            }

        }

        let output;

        if (message === "lock-set") output = this.lockSet(data, worker);
        else if (message === "lock-delete") output = this.lockDelete(data, worker);
        else await this.emit( message, { ...data, _worker: worker } );

        if (!worker._closed) //not closed already
            await worker.send( {msg: "confirmation", data: {confirmation: data.confirmation, output } } );

    }

    async sendReadyWorker(){
        return this.sendMessage( "ready-worker!", { result: true } );
    }

    async sendReadyMaster(worker){
        return this.sendMessage( "ready-master!", { result: true }, worker );
    }

    async sendMessage( msg, data, broadcast = false, emitToMySelf = true ){

        if (BROWSER) return; //no slaves in browser

        let confirmation = StringHelper.generateRandomId(32 );

        if ( this.isMaster ) {

            if (typeof broadcast === "boolean"){

                if (!broadcast)
                    throw new Exception(this, "process.send doesn't exist");

                const promises = [];

                for (const worker of this.stickyMaster.workers)
                    if (worker) {

                        if (worker._closed) continue; //closed already

                        const promise = new Promise( resolve => this["__promiseResolve" + confirmation ] = resolve );
                        promises.push( promise );

                        worker.send({msg: msg, data: { ... data, confirmation}, });

                        confirmation = StringHelper.generateRandomId(32 );
                    }

                if (emitToMySelf)
                    promises.push( this.emit( msg, {...data, _worker: process }) );

                return await Promise.all(promises);

            } else if (typeof broadcast === "number"){

                const worker = this.stickyMaster.workers[broadcast];

                if (worker._closed) return; //closed already

                const promise = new Promise( resolve => this["__promiseResolve"+confirmation] = resolve );

                worker.send({msg: msg, data: { ... data, confirmation}, });

                return await promise;

            } else
                throw new Exception(this, "broadcast parameter can be only boolean and number");


        } else {

            const promise = new Promise( resolve => this["__promiseResolve"+confirmation] = resolve );

            process.send({msg, data: { ...data, confirmation, broadcast},  });


            return promise;
        }



    }

    broadcastMessage(msg, data, emitToMySelf){
        return this.sendMessage(msg, data, true, emitToMySelf);
    }

    async close() {

        if (!this._startedStatus) return;

        if (this._statusOn)
            this._statusOn();

        await this._closed();

        this._startedStatus = false;
        await this._scope.events.emit("master-cluster/closed", this );

    }

    async _closed() {

        return Promise.all([
            this.serverCluster ? this.serverCluster.close() : undefined,
            this.clientsCluster ? this.clientsCluster.close() : undefined,
            this.stickyMaster ? this.stickyMaster.close() : undefined,
        ]);
    }

}

