import DBSchema from "../db-schema";

export default class DBSchemaString extends DBSchema {

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
