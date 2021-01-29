const Helper = require( "../../../helpers/helper");
const SchemaMarshal = require( "../schema-build");

class SchemaBuildBuffer extends SchemaMarshal {

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
    SchemaBuildBuffer: SchemaBuildBuffer,
    SchemaBuiltBuffer: new SchemaBuildBuffer(),
}