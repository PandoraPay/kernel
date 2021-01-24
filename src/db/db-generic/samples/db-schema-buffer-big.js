const Helper = require( "../../../helpers/helper");
const DBSchema = require( "../db-schema");
const CryptoHelper = require( "../../../helpers/crypto/crypto-helper");

const DBSchemaBuffer = require( "./db-schema-buffer" );

module.exports = class DBSchemaBufferBig extends DBSchemaBuffer {

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
