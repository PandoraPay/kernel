import Helper from "src/helpers/helper";
import DBSchemaBuffer from "./db-schema-buffer";

export default class DBSchemaBufferUnique extends DBSchemaBuffer {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

                fields: {
                    buffer: {

                        preprocessor(buffer){
                            this.id = buffer.toString("hex");
                            return buffer;
                        },

                    },

                    id: {
                        fixedBytes: 32,
                        unique: true,
                    },

                },

                options: {
                    returnOnlyField: "buffer",

                    hashing: {
                        enabled: true,
                        parentHashingPropagation: true,

                        fct: (a) => a,
                    }
                },

            },
            schema, false),  data, type, creationOptions);

    }

}
