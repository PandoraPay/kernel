import Helper from "src/helpers/helper";
import DBSchemaBuffer from "./db-schema-buffer";

export default class DBSchemaBufferUnique extends DBSchemaBuffer {

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
