const Helper = require( "../../../helpers/helper");
const DBMarshal = require( "../../../db/db-generic/db-marshal" );

module.exports = class DBSchemaBoolean extends DBMarshal {

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
