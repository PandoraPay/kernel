import DBSchema from "../db-schema";
import Helper from "src/helpers/helper"

export default class DBSchemaHash extends DBSchema {

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
