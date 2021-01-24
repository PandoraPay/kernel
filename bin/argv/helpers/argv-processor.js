module.exports = class ArgvProcessor {

    static processArgs (argv, parents = []) {

        for (const key in argv) {

            if (typeof argv[key] === "function") continue;
            if (argv[key] === undefined) continue;

            if (typeof argv._initArgv === "function" )
                argv._initArgv.call(argv, parents );

            if ( argv[key] && typeof argv[key] === "object" && argv[key].constructor.name === "Object" )
                ArgvProcessor.processArgs(argv[key], parents.concat( [ argv ] ) );

        }

    }

    static processCommandLineArgs(argv, argvBrowser ) {

        let optionsDefinition = [
            {name: 'verbose', alias: 'v', type: Boolean, typeName: "boolean", setValue: (newValue)=> argv.verbose = newValue  },
            {name: 'help', alias: 'h', type: Boolean, typeName: "boolean", setValue: (newValue)=> argv.verbose = newValue  }
        ];

        this._finalProcessing(argv, optionsDefinition, '');

        this._commandLineArgs(optionsDefinition, argvBrowser);

        if (argv.verbose)
            this._printCommandlineArgs(optionsDefinition);

    }

    static _finalProcessing(argv, optionsDefinition, affix = '', parents = []) {

        for (const key in argv) {

            if (typeof argv[key] === "function") continue;
            if (argv[key] === undefined) continue;

            if ( argv[key] && typeof argv[key] === "object" && argv[key].constructor.name === "Object" )
                ArgvProcessor._finalProcessing(argv[key], optionsDefinition, affix + key + ":", parents.concat( [ argv ] ) );
            else {

                const value = Array.isArray(argv[key]) ? argv[key][0] : argv[key];

                optionsDefinition.push({
                    name: affix + key,
                    type: ArgvProcessor._getType(typeof value),
                    typeName: typeof value,
                    multiple: Array.isArray(argv[key]),
                    //defaultOption: value,
                    setValue: newValue => argv[key] = newValue,
                });

            }

        }

    }

    static _getType(typename) {

        const typesMap = {
            "boolean": Boolean,
            "string": String,
            "number": Number,
            "object": Object,
        };

        return typesMap[typename];

    }

    static _printCommandlineArgs(optionsDefinition){

        for (const val of optionsDefinition)
            console.log( `--${val.name} ${val.typeName} ${val.multiple ? "array" : "" } ${val.defaultOption !== undefined ? "default "+val.defaultOption : "" }`);

    }

    /**
     * Processing Command Line Arguments using an options map
     * @param options
     * @private
     */
    static _commandLineArgs(options, argvBrowser = []){

        const argv = BROWSER ? argvBrowser : process.argv;

        for (let it =0; it < argv.length; it++){

            const arg = argv[it];

            if (typeof arg  === "string" && arg.indexOf("--") === 0) {

                const arg2 = arg.substr(2, arg.length);

                if (arg2.length === 0) continue;

                const params = [];

                let it2 = it+1;
                while (it2 < argv.length && typeof argv[it2] === "string" && argv[it2].indexOf("--") === -1){
                    params.push(argv[it2]);
                    it2++;
                }
                it = it2-1;

                let found ;
                for (const defintion of options)
                    if (defintion.name === arg2){

                        let newValue = params;
                        if (defintion.type === Boolean && params.length === 0) newValue = [true];

                        //console.info(`argv: ${defintion.name} argv of type ${typeof defintion.type} with new value ${defintion.type( ...newValue )}`);

                        defintion.setValue(defintion.type( ...newValue ));
                        found = true;
                        break;
                    }

                if (!found)
                    console.warn("Command Line was not found", arg2, );

            }

        }


        return options;

    }

}

