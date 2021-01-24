/**
 * scope
 *          argv, logger, db, masterCluster
 */

const Events = require( "../../helpers/events/events");
const HttpServer = require( "./http-server" )

module.exports = class MasterServerCluster  extends Events {

	constructor(scope)	{

		super();

		this._scope =  {
			...scope,
			HttpServer: HttpServer,
		};

		this._startedStatus = false;

		this.httpServer = undefined;
		this.serverSocket = undefined;

        this.emit("started");
	}

	async start(){


		if (this._startedStatus) return;

		const out = await this._started();

		this._startedStatus = true;

		this.emit("started");
		return out;

	}

	async _started(){

		//set http server
		this.httpServer = this._scope.httpServer;

		//set websocket server
		this.socketServer = this._scope.socketServer;

		//http server and websocket server are not supported by browsers

		if ( !this.httpServer && this._scope.HttpServer && this._scope.argv.masterCluster.serverCluster.httpServer.enabled)
			this.httpServer = new this._scope.HttpServer({
				...this._scope,
				clusterServer: this,
			});

		if (!this.serverSocket && this._scope.ServerSocket && this._scope.argv.masterCluster.serverCluster.serverSocket.enabled )
			this.serverSocket = new this._scope.ServerSocket({
				...this._scope,
				clusterServer: this,
				httpServer: this.httpServer,
			});

		let stickyOut;

		//starting httpServer
		if (this.httpServer && this._scope.argv.masterCluster.serverCluster.httpServer.enabled)
			stickyOut = await this.httpServer.start();

		//starting serverSocket
		if (this.serverSocket && this._scope.argv.masterCluster.serverCluster.serverSocket && this._scope.argv.masterCluster.serverCluster.serverSocket.enabled)
			await this.serverSocket.start();

		return {
			httpServer: this.httpServer,
			serverSocket: this.serverSocket,
			stickyOut: stickyOut,
		};

	}

	async close(emitEvent=true){

	    if (!this._startedStatus ) return;

	    await this._closed();

        if (emitEvent) this.emit("closed");

		this._startedStatus = false;
		return true;
	}

	async _closed(){

		await Promise.all( [
			this.httpServer ? this.httpServer.close() : undefined,
			this.serverSocket ? this.serverSocket.close() : undefined,
		] );

		this.httpServer = undefined;
		this.serverSocket = undefined;

	}

}

