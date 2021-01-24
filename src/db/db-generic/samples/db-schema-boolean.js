const Helper = require( "../../../helpers/helper");
const DBSchema = require( "../db-schema" );

module.exports = class DBSchemaBoolean extends DBSchema {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

            fields: {
                buffer: {
                    type: "boolean",
                    default: false,
                }
            },
            options:{
                returnOnlyField: "boolean",
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,

                    fct: (a) => a,
                }
            },


        }, schema, false),  data, type, creationOptions);

    }

}
