import Exception from "src/helpers/exception"
import Events from "src/helpers/events/events"

export default class MasterClientsCluster extends Events{
	
	constructor(scope)	{

		super();

        this._startedStatus = false;
        this._init = false;
	}

	async init(){
		if (this._init) return true;
		this._init = true;
	}

	async start(){

		if (this._startedStatus) return true;
		this._startedStatus = true;

		await this._started();

        this.emit("started");
        return true;
	}

	async _started(){

	}

	async close(){
		if (!this._startedStatus) return true;
		this._startedStatus = false;

		await this._closed();

        this.emit("closed");
        return true;
	}

	async _closed(){

	}

}

