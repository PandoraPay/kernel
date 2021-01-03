import RedisCommands from "./redis-commands"
import GenericMultiProcessor from "./../../db-generic/client/generic-multi-processor"

export default class RedisMultiProcessor extends GenericMultiProcessor {


    get _commands() {
        return RedisCommands
    }

    _call(){

        let out = super._call.apply(this, arguments);

        return this._multi[out.fct]( ...out.args );
    }

}
