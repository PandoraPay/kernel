const Helper = require( "../../../../helpers/helper");
const DBSchemaBuild = require( "../db-schema-build");

class BufferDBSchemaBuild extends DBSchemaBuild {

    constructor( options = {} ){

        super( Helper.merge( {

            fields: {
                buffer: {
                    type: "buffer",
                    fixedBytes: 32,
                }
            },

            options:{
                returnOnlyField: "buffer",

                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,

                    fct: a => a,
                }
            },

        }, options, true) );

    }

}

module.exports = {
    BufferDBSchemaBuild,
    BufferDBSchemaBuilt: new BufferDBSchemaBuild(),
}