const Helper = require.main.require( "./src/helpers/helper");
const DBSchema = require( "../db-schema");

module.exports = class DBSchemaHash extends DBSchema {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge( {
            
            fields: {
                
                /**
                 * Nonce for hash
                 */
                nonce: {
                    type: "number",
                    fixedBytes: 7,

                    position: 901,
                },
                
            },
            
            options:{
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,
                }
            }
            
        }, schema, false),  data, type, creationOptions);

    }

}
