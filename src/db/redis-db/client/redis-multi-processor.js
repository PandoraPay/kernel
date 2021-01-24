const RedisCommands = require("./redis-commands")
const GenericMultiProcessor = require( "./../../db-generic/client/generic-multi-processor")

module.exports = class RedisMultiProcessor extends GenericMultiProcessor {


    get _commands() {
        return RedisCommands
    }

    _call(){

        let out = super._call.apply(this, arguments);

        return this._multi[out.fct]( ...out.args );
    }

}
