import Helper from "src/helpers/helper";
import DBSchema from "../db-schema";

export default class DBSchemaBuffer extends DBSchema {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

                fields: {
                    buffer: {
                        type: "buffer",
                        fixedBytes: 32,
                    }
                },

                options:{
                    returnOnlyField: "buffer",
                    hashing: {
                        enabled: true,
                        parentHashingPropagation: true,

                        fct: (a) => a,
                    }
                },

            }, schema, false),  data, type, creationOptions);

    }

}
