const Helper = require( "../../../helpers/helper");
const SchemaBuild = require( "../schema-build");


class SchemaBuildNumber extends SchemaBuild {

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
    SchemaBuildNumber: SchemaBuildNumber,
    SchemaBuiltNumber: new SchemaBuildNumber(),
}