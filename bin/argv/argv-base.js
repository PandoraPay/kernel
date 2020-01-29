import ArgvHelper from "./helpers/argv-helper";
import ArgvProcessor from "./helpers/argv-processor";

export default {

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