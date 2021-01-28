const Helper = require( "../../../helpers/helper");
const DBMarshal = require( "../../../db/db-generic/db-marshal");
const CryptoHelper = require( "../../../helpers/crypto/crypto-helper");

const {SchemaBuildBuffer} = require( "./schema-build-buffer" );

module.exports = class DBSchemaBufferBig extends SchemaBuildBuffer {

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
