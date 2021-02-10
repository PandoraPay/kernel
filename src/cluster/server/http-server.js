const cluster = require( './../cluster');

const sticky = require('sticky-session');
const path = require('path');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

/**
 * scope:
 *          argv, logger, HttpServerRouter, SocketServer, SocketServerRouter
 */

module.exports = class HttpServer {

    constructor( scope ){

        this._scope = {
            ...scope,
        };

        this._express = express();
        this._express.scope = scope;

        this._express.use( cors( { credentials: true } ) );

        this._express.use('/public', express.static('bin/dist/public') );

        this._express.use(bodyParser.urlencoded({
            extended: true
        }));

        this._express.use(bodyParser.json());

        this._startedStatus = false;

    }

    async start(){

        if (this._startedStatus) return true;

        const out = await this._started();

        this._startedStatus = true;
        return out;

    }

    async _started(){

        this.server = require('http').createServer( {}, this._express);

        const stickyOut = await this._startServer( this.server, false);

        if (!stickyOut)
            return false;

        return stickyOut;
    }

    async _startServer(server, ssl){

        const stickyOut = await this._createStickyCluster(server, ssl);

        if (!stickyOut) return;

        server.on('error', (e) => {

            if (e.code === 'EADDRINUSE')
                this._scope.logger.log(`Http`, `Address in use ${this._scope.argv.masterCluster.serverCluster.httpServer.port} - ${this._scope.argv.masterCluster.serverCluster.httpServer.address}`);

            throw e;

        });

        server.once('close', () => {
            this._scope.logger.log(`Http`, `Stopping ${cluster.isMaster ? "Master" : "Slave" }`);
        });

        this._setRoutes(server);

        return stickyOut;

    }

    /**
     * Creates multiple instances to serve nodes
     * @returns {Promise<any>}
     */
    _createStickyCluster(server, ssl){

        return new Promise( async resolve  =>{

            try{

                /**
                 * Debug Workers will open on a separate port each for Unit Testing
                 * @type {number}
                 */

                let port = this._scope.argv.masterCluster.serverCluster.httpServer.port ;

                const isDebugging = this._scope.argv.debug.enabled || this._scope.argv.tests.isEnabled();

                if (isDebugging && process.env.SLAVE_INDEX !== undefined)
                    port += Number.parseInt(process.env.SLAVE_INDEX ) + 1;

                if (this._scope.argv.masterCluster.createClusters && ( !isDebugging || process.env.SLAVE_INDEX === undefined ) ){

                    const stickyOut = await sticky.listen(
                        server,
                        port, {
                            workers: this._scope.argv.masterCluster.workerCount,
                            env: this._scope.argv.masterCluster.workerEnv,
                            autoRespawn: this._scope.argv.masterCluster.autoRespawn,
                            disabled: this._scope.argv.debug.enabled ,
                        });

                    this._scope.logger.log(`Http`, `HTTP${ssl ? 'S':''} Server listens on port ${this._scope.argv.masterCluster.serverCluster.httpServer.port} ${cluster.isMaster ? "Master" : "Slave"}`);

                    resolve( stickyOut );


                } else {

                    server.listen( port, ()=>{
                        resolve( { type: "simple" } );
                    });

                }

            } catch (err){

                resolve(undefined);

            }


        })

    }

    _setRoutes(){

        this._express.get("/", (req, res)=>{

            res.json( { worker: this._scope.masterCluster.workerName } );

        });

    }

    async close(){

        if (!this._startedStatus) return true;

        await this._closed();

        this._startedStatus = false;
    }

    async _closed(){
        await this.server.close();
        delete this.server ;
    }

}


