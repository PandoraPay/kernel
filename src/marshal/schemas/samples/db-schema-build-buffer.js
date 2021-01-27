const Helper = require( "../../../helpers/helper");

const SchemaMarshal = require( "../schema-build");

class SchemaMarshalBuild extends SchemaMarshal {

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

                        fct: (a) => a,
                    }
                },

            }, options, true) );

    }

}

module.exports = {
    SchemaBuildBufferClass: SchemaMarshalBuild,
    SchemaBuildBuffer: new SchemaMarshalBuild(),
}