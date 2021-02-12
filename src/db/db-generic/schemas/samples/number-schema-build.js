const Helper = require( "../../../../helpers/helper");
const DBSchemaBuild = require( "../db-schema-build");

class NumberSchemaBuild extends DBSchemaBuild {

    constructor( options = {} ){

        super( Helper.merge( {

            fields: {
                number: {
                    type: "number",
                }
            },

            options:{
                returnOnlyField: "number",
                hashing: {
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