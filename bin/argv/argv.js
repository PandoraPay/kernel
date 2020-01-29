import ArgvBase from "./argv-base"
import ArgvLogger from './modules/argv-logger';
import ArgvSettings from "./modules/argv-settings";
import ArgvTests from "./modules/tests/argv-tests"
import ArgvDebug from "./modules/argv-debug"

import ArgvDBPublic from "./modules/db/public/argv-db-public"
import ArgvDBPrivate from "./modules/db/private/argv-db-private"

import ArgvMasterCluster from "./modules/master-cluster/argv-master-cluster"
import ArgvHeartBeat from "./modules/heart-beat/argv-heart-beat"
import ArgvBansManager from "./modules/bans-manager/argv-bans-manager"

import Helper from "src/helpers/helper"

/**
 *
 * Blockchain: Blockchain
 *
 */


export default (argv) => Helper.merge( argv, {

    ...ArgvBase,

    logger: ArgvLogger,
    settings: ArgvSettings,
    tests: ArgvTests,
    debug: ArgvDebug,

    masterCluster: ArgvMasterCluster,
    heartBeat: ArgvHeartBeat,
    bansManager: ArgvBansManager,

    dbPublic: ArgvDBPublic,
    dbPrivate: ArgvDBPrivate,


});



