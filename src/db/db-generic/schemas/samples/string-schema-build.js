const Helper = require( "../../../../helpers/helper");
const DBSchemaBuild = require( "../db-schema-build");

class StringSchemaBuild extends DBSchemaBuild {

    constructor(schema = {}){

        super( Helper.merge( {

            fields: {
                string: {
                    type: "string",
                    minSize:0,
                    maxSize: 255,
                }
            },

            options:{
                returnOnlyField: "string",
                hashing: {
                    fct: a => a,
                },
            }
        },  schema, true) );

    }

}


module.exports = {
    StringSchemaBuild,
    StringSchemaBuilt: new StringSchemaBuild()
}