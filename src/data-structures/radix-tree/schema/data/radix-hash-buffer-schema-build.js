const {BufferSchemaBuild} = require( "../../../../db/db-generic/schemas/samples/buffer-schema-build" );
const Helper = require( "../../../../helpers/helper");

class RadixHashBufferSchemaBuild extends BufferSchemaBuild{

    constructor( options = {} ) {

        super(Helper.merge({

            fields: {
                buffer: {
                    minSize: 32,
                    maxSize: 32,
                }
            },

        }, options, true));

    }

}

module.exports = {
    RadixHashBufferSchemaBuild,
    RadixHashBufferSchemaBuilt: new RadixHashBufferSchemaBuild(),
};