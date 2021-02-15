
module.exports = class CommandLineInterface {

    constructor(scope){

        this._scope = scope;

    }

    start(){

        this._init();

    }
    
    get figlet(){
        return "\n" +
                "██████╗  █████╗ ███╗   ██╗██████╗  ██████╗ ██████╗  █████╗ ██████╗  █████╗ ██╗   ██╗\n"+
                "██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝\n"+
                "██████╔╝███████║██╔██╗ ██║██║  ██║██║   ██║██████╔╝███████║██████╔╝███████║ ╚████╔╝\n"+
                "██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██║   ██║██╔══██╗██╔══██║██╔═══╝ ██╔══██║  ╚██╔╝\n"+
                "██║     ██║  ██║██║ ╚████║██████╔╝╚██████╔╝██║  ██║██║  ██║██║     ██║  ██║   ██║\n"+
                "╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝\n";


    }

    _init (){

        if (!process.env.SLAVE){

            console.log(
                "\x1b[31m",
                this.figlet,
                '\x1b[0m'
            );

            console.log("VERSION: ", this._scope.argv.settings.buildVersion );

        }

    }

    askInput(title, defaultValue){

        if ( BROWSER ){

            const out = prompt(title, defaultValue);
            return out;

        }else {
            throw Error("Ask Input Not implemented");
        }
    }

    askConfirmation(title){

        if ( BROWSER ){

            const out = confirm(title);
            return out;

        } else {
            throw Error("Ask Confirmation Not implemented");
        }
    }
  
}

