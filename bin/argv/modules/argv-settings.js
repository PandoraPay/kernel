const NetworkTypeEnum = require("./network-type-enum")

const DATE_ORIGIN  = new Date("September 21, 2015 11:13:00");
const DATE_ORIGIN_SECONDS  = Math.floor( DATE_ORIGIN / 1000 ) ;

module.exports ={

    applicationName: "COBOLT",
    applicationShort: "COB",

    applicationDescription: 'Description',
    buildVersion: "0.1",

    versionCompatibility: version => version >= 0.1,

    /**
     * defined in protocol because it is used in multiple other modules (Crypto, Network and Blockchain)
     */
    networkType: NetworkTypeEnum.NETWORK_MAIN_NET,

    /**
     * To avoid issues with timestamp in the future for next 100 years
     */

    dateOrigin: DATE_ORIGIN_SECONDS,

    getDateNow: () => Math.floor(  new Date().getTime() / 1000)  - DATE_ORIGIN_SECONDS,

    hashMapVirtualCacheSize: 1000,

}