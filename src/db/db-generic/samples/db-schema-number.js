import DBSchema from "../db-schema";

export default class DBSchemaNumber extends DBSchema {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, {
            fields: {
                number: {
                    type: "number",
                    fixedBytes: 7,
                }
            },
            options:{
                returnOnlyField: "number",

                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: (a)=>a,

                },

            }
        },  data, type, creationOptions);

    }

}
