const Helper = require( "../../../../helpers/helper");
const DBSchemaBuild = require( "../db-schema-build");

class NumberSchemaBuild extends DBSchemaBuild {

    constructor( options = {} ){

        super( Helper.merge( {

            fields: {
                number: {
                    type: "number",
                    fixedBytes: 7,
                }
            },

            options:{
                returnOnlyField: "number",

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
    NumberSchemaBuild,
    NumberSchemaBuilt: new NumberSchemaBuild(),
}