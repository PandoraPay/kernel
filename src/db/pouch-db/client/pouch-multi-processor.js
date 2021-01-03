import PouchCommands from "./pouch-commands"
import GenericMultiProcessor from "./../../db-generic/client/generic-multi-processor"

export default class PouchMultiProcessor extends GenericMultiProcessor{

    get _commands(){
        return PouchCommands
    }

    async _exec(){

        const data = [];
        for (const it of this._list)
            data.push( await this._multi[it.fct](...it.args) );

        return data;

        //promise for pouchdb will result in errors due to multi-concurrency
        //todo keep Promise.all after pouch.multi will be integrated

        return Promise.all ( this._list.map( it => this._multi[it.fct]( ...it.args) ) ) ;
    }

}

