const readline = require('readline');

export default class ReadlineNode {

    constructor( scope ){

        this._scope = scope;

        if (!process.env.SLAVE)
            this._initReadlineNode();

    }

    _initReadlineNode(){

        try{

            this._readline = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            this._readline.on("SIGINT", () => this._closeReadline() );

        } catch (err){
            this._scope.logger.error(this, "initReadlineNode raised an error", err );
        }

    }

    _closeReadline(){

        try{

            if ( this._readline ) {
                this._readline.close();
                this._readline = undefined;
            }

        } catch (err){
            this._scope.logger.error(this, "closeReadlineNode raised an error", err );
        }

        process.exit(0);

    }

    input(text = '', defaultValue = ''){

        return new Promise((resolve)=>{

            this._readline.question(`${text}: `, output => resolve(output) );

        });
    }

    confirm(text = ''){
        return this.input(text);
    }

}

