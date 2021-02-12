const Helper = require( "../../../../helpers/helper");
const DBSchemaBuild = require( "../db-schema-build");

class BufferSchemaBuild extends DBSchemaBuild {

    constructor( options = {} ){

        super( Helper.merge( {

            fields: {
                buffer: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,
                }
            },

            options:{
                returnOnlyField: "buffer",
                hashing: {
                    fct: a => a,
                }
            },

        }, options, true) );

    }

}

module.exports = {
    BufferSchemaBuild,
    BufferSchemaBuilt: new BufferSchemaBuild(),
}