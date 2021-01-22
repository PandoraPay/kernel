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
        this._startingStatus = false;

        this.isMaster = undefined;
        this.isWorker = undefined;
        this.workerId = undefined;
        this.workerName = undefined;
        this.clientsCluster = undefined;
        this.serverCluster = undefined;

        if (applyConstructor)
            this._constructor(scope);

        this.startedPromise = undefined;
        this._startedPromiseResolver = undefined;

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

        if (this._startedStatus || this._startingStatus ) return this.startedPromise;

        this._startingStatus = true;

        if (cluster.isMaster)
            await Helper.sleep(100)

        await this._started();

        await this._scope.events.emit("master-cluster/started", this );
        this._startedStatus = true;
        this._startingStatus = false;

        return this.startedPromise;
    }

    async _started(){

        const isMaster = cluster.isMaster;

        this.isMaster = isMaster;
        this.isWorker = !isMaster;

        const workerId = isMaster ? 'master' : Number.parseInt( process.env.SLAVE_INDEX);

        this.workerName = isMaster ? "master" : "worker" + workerId;
        this.workerId = workerId;

        if (!isMaster)
            process.index = "master";

        this.startedPromise = new Promise( resolve => {
            this._startedPromiseResolver = resolve;
        });

        if ( isMaster )
            await this._scope.db.client.lockDeleteAll();

        this._scope.masterCluster = this;
        this._scope.app._scope.masterCluster = this;

        await this._scope.events.emit("master-cluster/initialized", this);

        if (this.clientsCluster)
            await this.clientsCluster.init();

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
                     * waiting for receiving all hello
                     */

                    const done = { };
                    let count = 0, broadcasted = false;

                    this._statusExitOn = this.on("exit-worker", async data =>{

                        this._scope.logger.log(this, 'exit-worker2', {} );

                        if (!data.result) return;

                        for (let i=this.stickyMaster.workers.length-1; i >= 0; i--)
                            if (this.stickyMaster.workers[i].index === data._workerIndex) {

                                const worker = this.stickyMaster.workers[i];
                                this.stickyMaster.workers.splice(i, 1);

                                await worker.send( {msg: "confirmation", data: {confirmation: data.confirmation, output: true } } );

                                worker._closed = true;
                                this._scope.logger.log(this, 'worker removed', {index: i});
                                return true;
                            }

                        return false;
                    });

                    this._statusOn = this.on("ready-worker", async data =>{

                        if (!data.result) return;

                        this._scope.logger.info(this, 'ready-worker received');

                        //should take workers into
                        if (!done[data._workerIndex]) {
                            done[data._workerIndex] = 0;
                            count++;
                        }

                        done[data._workerIndex]++;

                        if (count === this.stickyMaster.workers.length  ) {

                            if (!broadcasted) {
                                broadcasted = true;
                                await this.sendReadyMasterConfirmation( true );
                                await Helper.sleep(100);
                                this._startedPromiseResolver(true);
                            } else {
                                await this.sendReadyMasterConfirmation( data._workerIndex );
                            }

                        }

                    });


                } else {

                    /**
                     * Worker aka Slave
                     */

                    process.on("message", data =>
                        this.receivedData( process,
                            data.msg, data.data ) );

                }


                this._scope.logger.info( this, `Instance created ${this.workerName}`);

            }

        }

        if (isMaster)
            await Helper.promiseTimeout( this.startedPromise, 60*1000 );

        if (this.clientsCluster)
            await this.clientsCluster.start();

        if (this.isWorker) {

            //this._scope.logger.info(this, 'sendReadyWorker sending' );

            this.on("ready-master", ()=>{
                //this._scope.logger.info(this, 'ready-master received' );
                this._startedPromiseResolver(true);
            })

            await this.sendReadyWorker();
            //this._scope.logger.info(this, 'sendReadyWorker received' );
        }

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
            }finally {
                delete this["__promiseResolve" + data.confirmation];
            }

            return;
        }

        data = BufferHelper.processBufferArray(data);

        let output;

        if (message === "lock-set") output = this.lockSet(data, worker);
        else if (message === "lock-delete") output = this.lockDelete(data, worker);
        else {
            const broadcast = data.broadcast;
            const emitToMySelf = data.emitToMySelf;
            data.broadcast = false;
            data.emitToMySelf = false;
            output = await this.sendMessage(message, data, broadcast, emitToMySelf, false);
        }

        //this._scope.logger.log(this, "output " +message, {confirmation: data.confirmation, output } );

        if (!worker._closed) //not closed already
            await worker.send( {msg: "confirmation", data: {confirmation: data.confirmation, output } } );

    }

    async sendReadyWorker(){
        return this.sendMessage( "ready-worker", { result: true }, "master", false );
    }

    async sendReadyMasterConfirmation(worker){
        return this.sendMessage( "ready-master", { result: true }, worker );
    }

    async sendExitWorker(){
        this._scope.logger.log(this, "exit-worker");
        return this.sendMessage( "exit-worker", { result: true }, "master", false );
    }

    async sendExitWorkerConfirmation(worker){
        return this.sendMessage( "exit-worker", { result: true }, worker );
    }

    async sendMessage( msg, data, broadcast = false, emitToMySelf = true, includeWorkerIndex = true ){

        if (BROWSER) return; //no slaves in browser

        if (includeWorkerIndex)
            data._workerIndex = this.workerId;

        let confirmation = StringHelper.generateRandomId(32 );

        const output = [];

        if ( this.isMaster ) {

            if ( broadcast === "master"){
                output.push( this.emit(msg, {...data, _worker: process }) );
            } else
            if (typeof broadcast === "boolean"){

                if (broadcast){

                    for (const worker of this.stickyMaster.workers)
                        if (worker && !worker._closed) {

                            const promise = new Promise( resolve => this["__promiseResolve" + confirmation ] = resolve );
                            output.push( promise );

                            try{
                                worker.send({msg: msg, data: { ... data, confirmation, broadcast:false, emitToMySelf: true}, _workerIndex: this.workerId });
                                confirmation = StringHelper.generateRandomId(32 );
                            }catch(err){
                                this._scope.logger.error(this, 'worker.send returned an error', err);
                                this["__promiseResolve" + confirmation ]();

                            }

                        }

                    emitToMySelf = true;

                }

            } else if (typeof broadcast === "number" ){

                const worker = this.stickyMaster.workers[broadcast];
                if (worker._closed) return; //closed already

                output.push ( new Promise( resolve => this["__promiseResolve"+confirmation] = resolve ) );
                worker.send({msg: msg, data: { ... data, confirmation}, });

            } else
            if (typeof broadcast === "object"){
                const worker = broadcast;
                if (worker._closed) return; //closed already

                output.push ( new Promise( resolve => this["__promiseResolve"+confirmation] = resolve ) );
                worker.send({msg: msg, data: { ... data, confirmation}, });
            } else
                throw new Exception(this, "broadcast parameter can be only boolean and number");

        } else {

            output.push( new Promise( resolve => this["__promiseResolve"+confirmation] = resolve ) );
            process.send({msg, data: { ...data, confirmation, broadcast, emitToMySelf } });

        }

        if (emitToMySelf)
            output.push(this.emit(msg, {...data, _worker: process }));

        return await Promise.all(output);

    }

    broadcastMessage(msg, data, broadcast = true, emitToMySelf){
        return this.sendMessage(msg, data, broadcast, emitToMySelf);
    }

    async close() {

        if (!this._startedStatus) return;

        if (typeof this._statusOn === "function")
            this._statusOn();

        if (typeof this._statusExitOn === "function")
            this._statusExitOn();

        await this._closed();

        this._startedStatus = false;
        this._startingStatus = false;

        await this._scope.events.emit("master-cluster/closed", this );

    }

    async _closed() {

        if (this.serverCluster) {
            await this.serverCluster.close();
            this._scope.logger.log(this, "serverCluster closed");
        }

        if (this.clientsCluster) {
            await this.clientsCluster.close();
            this._scope.logger.log(this, "clientsCluster closed");
        }

        if (this.stickyMaster) {
            await this.stickyMaster.close();
            this._scope.logger.log(this, "stickyMaster closed");
        }
    }

}

