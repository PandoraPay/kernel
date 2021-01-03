import Helper from "src/helpers/helper"
import ArgvProcessor from "./argv-processor"

export default class ArgvHelper{

    static importArguments(argv1, argv2){

        if (!argv1 || !argv2) return;

        return Helper.import( argv1, argv2 );
    }

    static processCommandLine(argv, argvBrowser){

        ArgvProcessor.processCommandLineArgs(argv, argvBrowser);

    }

    static processArgs(argv){

        ArgvProcessor.processArgs(argv, );

    }

}

