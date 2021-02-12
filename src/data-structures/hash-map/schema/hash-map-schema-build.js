const DBSchemaBuild = require( "../../../db/db-generic/schemas/db-schema-build" );
const Helper = require( "../../../helpers/helper");

class HashMapSchemaBuild extends DBSchemaBuild {

    constructor(schema = {}) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "hashmap",
                    minSize: 7,
                    maxSize: 7,
                },

                id : {
                    minSize: "map",
                    maxSize: 3,
                    unique: 3,
                },

            },

            options:{
                hashing:{
                    hashing: false,
                },
            },

            saving: {
                saveInfixParentId: true,
            }

        }, schema, false));
    }

}

module.exports = {
    HashMapSchemaBuild,
    HashMapSchemaBuilt: new HashMapSchemaBuild()
}