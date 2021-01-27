const DBMarshal = require( "../../../db/db-generic/db-marshal" );

module.exports = class DBSchemaString extends DBMarshal {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, {

            fields: {
                string: {
                    type: "string",
                    minSize:0,
                    maxSize: 255,
                }
            },

            options:{
                returnOnlyField: "string",
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: (a)=>a,

                },
            }
        },  data, type, creationOptions);

    }

}
