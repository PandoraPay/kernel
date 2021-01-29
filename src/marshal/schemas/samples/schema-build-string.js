const Helper = require( "../../../helpers/helper");
const SchemaMarshal = require( "../schema-build");

class SchemaBuildString extends SchemaMarshal {

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
    SchemaBuildString,
    SchemaBuiltString: new SchemaBuildString()
}