const ArgvHelper = require("./helpers/argv-helper");
const ArgvProcessor = require("./helpers/argv-processor");

module.exports = {

    verbose: false,

    importArguments(argv2){
        return ArgvHelper.importArguments(this, argv2);
    },


    processCommandLine(argvBrowser){
        return ArgvHelper.processCommandLine(this, argvBrowser);
    },

    processArgs(argv){

        ArgvProcessor.processArgs(argv, );

    }

};