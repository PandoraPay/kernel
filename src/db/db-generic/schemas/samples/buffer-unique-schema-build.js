const Helper = require( "../../../../helpers/helper");
const {BufferSchemaBuild} = require( "./buffer-schema-build");

class BufferUniqueSchemaBuild extends BufferSchemaBuild {

    constructor(schema){

        super(Helper.merge( {

            fields: {

                id: {
                    fixedBytes: 32,
                    minSize: 32,
                    maxSize: 32,
                    unique: true,
                },

                buffer: {

                    preprocessor(buffer){
                        this.id = buffer.toString("hex");
                        return buffer;
                    },

                },

            },

            //options inherited

        },
        schema, true ) );

    }

}

module.exports = {
    BufferUniqueSchemaBuild,
    BufferUniqueSchemaBuilt: new BufferUniqueSchemaBuild()
}