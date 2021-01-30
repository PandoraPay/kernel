const Helper = require( "../../../../helpers/helper");
const DBSchemaBuild = require( "../db-schema-build");

class StringDBSchemaBuild extends DBSchemaBuild {

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

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: a => a,

                },
            }
        },  schema, true) );

    }

}


module.exports = {
    StringDBSchemaBuild,
    StringDBSchemaBuilt: new StringDBSchemaBuild()
}