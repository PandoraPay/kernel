import Helper from "src/helpers/helper";
import DBSchema from "../db-schema";

export default class DBSchemaBoolean extends DBSchema {

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
