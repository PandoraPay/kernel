import AsyncEvents from "async-events";

import Logger from "./helpers/logger/logger";
import Argv from "bin/argv/argv";
import Readline from "./helpers/readline/readline";
import DBConstructor from "./db/db-constructor";

import Tests from 'tests/tests/tests-index';
import RunTests from "tests/tests/run-tests";

import MasterCluster from "./cluster/master-cluster";
import CommandLineInterface from "./cli/command-line-interface";
import HeartBeat from "./heart-beat/heart-beat";
import BansManager from "./helpers/bans-manager/bans-manager";

import Events from "./helpers/events/events";
import Helper from "src/helpers/helper";

/**
 *
 * scope
 *      argv, logger, readline, tests, masterCluster, httpServer, socketServer
 *
 * @param scope
 * @returns {Promise.<*>}
 */

export default class App{

    constructor(scope = {}){

        this.events = new AsyncEvents();
        this._scope = scope;

        this._createMasterClusterInit = true;

    }

    setAdditionalEvents(){

        

    }

    _initProcess(){

        process.once('cleanup', async (error, code) => {

            this._scope.logger.info(`Status`, 'Cleaning up...', code);

            process.once('SIGTERM', () => {
                process.emit('cleanup');
            });

            process.once('exit', code => {
                process.emit('cleanup', null, code);
            });

            process.once('SIGINT', () => {
                process.emit('cleanup');
            });


            if (error) {
                this._scope.logger.fatal(`Status`,error);
                process.emit('cleanup', error);
            } else
                this._scope.logger.info(`Status`, 'Modules ready and launched');


        });

        // TODO: This should be the only place in the master process where
        // 'uncaughtException' is handled. Right now, one of our dependencies (js-nacl;

        process.on('uncaughtException', ( err ) => {

            // Handle error safely
            this._scope.logger.fatal(`Status`, 'System error', err);
            process.emit('cleanup', err);

        });

        process.on('unhandledRejection', ( err ) => {

            // Handle unhandledRejection safely
            process.emit('cleanup', err);

        });

    }

    setScope( objects = this, name = "masterCluster", value, uniqueId, additionalObjects = []  ){

        if (!Array.isArray(objects)) objects = [objects];
        if (!Array.isArray(additionalObjects)) additionalObjects = [additionalObjects];

        objects = objects.concat( additionalObjects );

        for (const object of objects){

            if (typeof object !== "object") return;

            if (!uniqueId){
                do{
                    uniqueId = Math.random();
                }while( object.__scopeUniqueId === uniqueId)
            }

            if (object.__scopeUniqueId === uniqueId) return ;
            object.__scopeUniqueId = uniqueId;

            if ( object._scope )
                object._scope[name] = value;

            for (const key in object)
                if ( object[key] && typeof object[key] === "object" && object[key]._scope && typeof object[key]._scope === "object" )
                    this.setScope( object[key], name, value, uniqueId);

            if (object._scope)
                for (const key in object._scope)
                    this.setScope( object._scope[key], name, value, uniqueId );

        }


    }

    async createMasterCluster(scope = this._scope, merge = {} ){

        await this.events.emit('master-cluster/creation', scope);

        const masterCluster = new scope.MasterCluster ( Helper.merge( scope, merge, false ) );

        this.setScope( { _scope: scope }, "masterCluster", masterCluster);

        return masterCluster;
    }

    async start( ){

        this._scope = {

            app: this,
            DBConstructor: DBConstructor,
            MasterCluster: MasterCluster,
            HeartBeat: HeartBeat,
            BansManager: BansManager,
            CommandLineInterface: CommandLineInterface,
            Readline: Readline,
            Logger: Logger,

            tests: [ Tests.tests ],
            events: this.events,

            ...this._scope||{},
        };

        this.setAdditionalEvents(this._scope);

        this._scope.argv = Argv(this._scope.argv||{} );

        await this.events.emit("start/argv-set", this._scope );

        if (!this._scope.logger)
            this._scope.logger = new this._scope.Logger( { argv: this._scope.argv } );

        await this.events.emit("start/logger-created", this._scope );

        if (!this._scope.readline)
            this._scope.readline = new this._scope.Readline( this._scope );

        await this.events.emit("start/readline-created", this._scope );

        if (!this._scope.cli)
            this._scope.cli = new this._scope.CommandLineInterface(this._scope);

        this._scope.cli.start();

        await this.events.emit("start/cli-started", this._scope );

        //this._scope.logger.info(`Status`, `Starting ${this._scope.argv.settings.applicationName} with argv: `, this._scope.argv );

        this._initProcess(this._scope);

        await this.events.emit("start/init-processed", this._scope );

        this._scope.logger.info(`Status`, `Protocol has been started`);

        this._scope.argv.processCommandLine(this._scope.argvBrowser);

        await this.events.emit("start/command-line-processed", this._scope );

        const isTests = this._scope.argv.tests.isEnabled();

        if (isTests){

            this._scope.argv = Tests.argvTests(this._scope.argv);
            await this.events.emit("start/tests-args-middleware", (this._scope));

        }

        this._scope.argv.processArgs(this._scope.argv);

        await this.events.emit("start/args-processed", this._scope );

        /**
         * Start Heart Beat
         */

        if (!this._scope.heartBeat)
            this._scope.heartBeat = new this._scope.HeartBeat( this._scope );

        if (this._scope.argv.heartBeat.enableHeartBeat)
            await this._scope.heartBeat.start();

        await this.events.emit("start/heart-beat-started", this._scope );

        if (!this._scope.bansManager)
            this._scope.bansManager = new this._scope.BansManager( this._scope );

        if (this._scope.argv.bansManager.enableBansManager)
            await this._scope.bansManager.start();

        await this.events.emit("start/ban-manager-started", this._scope );

        //create Database Public client
        if (!this._scope.dbPublic && this._scope.argv.dbPublic.create) {
            this._scope.dbPublic = await this._scope.DBConstructor.createPublicDatabase( this._scope );

            //by default database is the public ones
            this._scope.db = this._scope.dbPublic;
        }

        await this.events.emit("start/public-db-created", this._scope );

        //create Database Private client
        if ( !this._scope.dbPrivate && this._scope.argv.dbPrivate.create )
            this._scope.dbPrivate = await this._scope.DBConstructor.createPrivateDatabase( this._scope );

        await this.events.emit("start/private-db-created", this._scope );

        //connect Database client
        if (this._scope.dbPublic)
            if (await this._scope.dbPublic.connectDB())
                this._scope.logger.info(`Status`, `Public Main Database was connected successfully`);

        await this.events.emit("start/public-db-connected", this._scope );

        if (this._scope.dbPrivate)
            if (await this._scope.dbPrivate.connectDB())
                this._scope.logger.info(`Status`, `Private Database was connected successfully`);

        await this.events.emit("start/private-db-connected", this._scope );

        await this.events.emit("start/databases-connected", this._scope, ()=>console.log("FINISHED") );

        //start the tests
        if ( isTests ){

            await this.events.emit("start/tests-before-start", this._scope );

            await RunTests( this._scope );

            await this.events.emit("start/tests-started", this._scope );

            return true;g

        }

        await this.events.emit("start/before-master-cluster", this._scope );

        /**
         * Master Clusters will not open in tests in order to enable customized cluster tests
         */

        if ( this._scope.argv.masterCluster.enableClusters && this._createMasterClusterInit  ){

            if ( !this._scope.masterCluster ) await this.createMasterCluster(this._scope);

            if (this._scope.masterCluster)
                await this._scope.masterCluster.start();

        }

        return true;

    }

}
