const Helper = require( "../../../../helpers/helper");
const {BufferDBSchemaBuild} = require( "./buffer-db-schema-build");

class BufferUniqueDBSchemaBuild extends BufferDBSchemaBuild {

    constructor(schema){

        super(Helper.merge( {

            fields: {

                id: {
                    fixedBytes: 32,
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
    BufferUniqueDBSchemaBuild,
    BufferUniqueDBSchemaBuilt: new BufferUniqueDBSchemaBuild()
}