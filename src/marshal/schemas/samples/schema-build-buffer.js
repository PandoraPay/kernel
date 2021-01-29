const Helper = require( "../../../helpers/helper");
const SchemaBuild = require( "../schema-build");

class SchemaBuildBuffer extends SchemaBuild {

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