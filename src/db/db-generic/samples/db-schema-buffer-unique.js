const Helper = require( "../../../helpers/helper");
const DBSchemaBuffer = require( "./db-schema-buffer");

module.exports = class DBSchemaBufferUnique extends DBSchemaBuffer {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

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
            schema, false),  data, type, creationOptions);

    }

}
