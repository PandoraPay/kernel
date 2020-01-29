import Helper from "src/helpers/helper";
import DBSchema from "../db-schema";
import CryptoHelper from "src/helpers/crypto/crypto-helper";

import DBSchemaBuffer from "./db-schema-buffer";

export default class DBSchemaBufferBig extends DBSchemaBuffer {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

            fields: {
                buffer: {
                    fixedBytes: undefined,
                    minSize: 1,
                    maxSize: 65535
                }
            },

            options:{
                returnOnlyField: "buffer",
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,

                    fct: CryptoHelper.dkeccak256,
                }
            },


        }, schema, false),  data, type, creationOptions);

    }

}
