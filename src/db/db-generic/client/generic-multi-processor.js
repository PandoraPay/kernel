export default class GenericMultiProcessor{

    constructor( scope, client ){

        this._scope = scope;
        this._client = client;
        this._multi = client.multi();

        this._list = [];

        const commands = this._commands;

        for (const fct of commands)
            this[ typeof fct === "object" ? fct.fct : fct ] = (...args) => this._call( typeof fct === "object" ? fct.original : fct , ...args)

    }

    get _commands(){
        return {

        }
    }

    _call(...args){

        let cb, end;
        if (typeof args[arguments.length-1] === "function"){
            cb = args[arguments.length-1];
            end = arguments.length-1;
        } else
            end = arguments.length;

        this._list.push( {
            cb: cb,
            fct: args[0],
            args: args.slice(1, end ),
        } );

        return this._list[this._list.length-1];

    }

    async _exec(){
        return this._multi.execAsync();
    }

    async exec(){

        const data = await this._exec();

        await Promise.all( this._list.map ( ( it, index) => it.cb ? it.cb (data[index]) : data[index] ) );

        this._list = [];

        return data;


    }

    async execAsync(){
        return this.exec();
    }

}