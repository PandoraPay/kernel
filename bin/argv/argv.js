const ArgvBase = require( "./argv-base")
const ArgvLogger = require( './modules/argv-logger');
const ArgvSettings = require( "./modules/argv-settings");
const ArgvTests = require( "./modules/tests/argv-tests")
const ArgvDebug = require( "./modules/argv-debug")

const ArgvDBPublic = require( "./modules/db/public/argv-db-public")
const ArgvDBPrivate = require( "./modules/db/private/argv-db-private")

const ArgvMasterCluster = require( "./modules/master-cluster/argv-master-cluster")
const ArgvHeartBeat = require( "./modules/heart-beat/argv-heart-beat")
const ArgvBansManager = require( "./modules/bans-manager/argv-bans-manager")

const Helper = require.main.require( "./src/helpers/helper")

/**
 *
 * Blockchain: Blockchain
 *
 */

module.exports = (argv) => Helper.merge( argv, {

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



