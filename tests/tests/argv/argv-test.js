const Helper = require( "../../../src/helpers/helper" )
const NetworkTypeEnum = require("../../../bin/argv/modules/network-type-enum");

module.exports = (argv) => Helper.merge( argv, {

    dbPublic: {

        redisDB: {
            db:2,
        },

        pouchDB: {
            path: "test_leveldb",
        },

        couchDB: {
            db: "test_network"
        }

    },

    dbPrivate: {

        pouchDB:{
            path: "test_private_leveldb",
        }

    },

    settings: {
        networkType : NetworkTypeEnum.NETWORK_TEST_NET
    },

})