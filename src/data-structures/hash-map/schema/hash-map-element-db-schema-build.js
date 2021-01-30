const DBSchemaBuild = require( "../../../db/db-generic/db-schema-build" );
const Helper = require( "../../../helpers/helper");
const Exception = require("../../../helpers/exception");

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
                    unique: false, // it is verified by the hash map
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
                    enabled: false,
                },
            },


        }, schema, false));
    }

}

module.exports = {
    HashMapElementDBSchemaBuild: HashMapElementDBSchemaBuild,
    HashMapElementDBSchemaBuilt: new HashMapElementDBSchemaBuild()
}