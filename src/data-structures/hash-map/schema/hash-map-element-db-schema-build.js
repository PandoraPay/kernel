const DBSchemaBuild = require( "../../../db/db-generic/schemas/db-schema-build" );
const Helper = require( "../../../helpers/helper");
const Exception = require("../../../helpers/exception");
const CryptoHelper = require( "../../../helpers/crypto/crypto-helper");

class HashMapElementDBSchemaBuild extends DBSchemaBuild {

    constructor(schema = {}) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "hashmap",
                    fixedBytes: 7,
                },

                id : {
                    fixedBytes: 64,
                    unique: true,
                },

                data: {

                    type: "buffer",
                    minSize: 0,
                    maxSize: 255,
                    position: 1000,

                },

            },

            options:{
                hashing:{
                    enabled: true,
                    parentHashingPropagation: false,
                    fct: CryptoHelper.sha256
                },
            },


        }, schema, false));
    }

}

module.exports = {
    HashMapElementDBSchemaBuild: HashMapElementDBSchemaBuild,
    HashMapElementDBSchemaBuilt: new HashMapElementDBSchemaBuild()
}