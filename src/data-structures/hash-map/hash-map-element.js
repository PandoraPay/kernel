import DBSchema from "../../db/db-generic/db-schema";
import Helper from "../../helpers/helper";
import Exception from "src/helpers/exception";

export default class HashMapElement extends DBSchema {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "hashmap",
                    fixedBytes: 7,
                },

                id : {
                    fixedBytes: 64,
                    unique: false,
                },

                data: {

                    type: "buffer",
                    minSize: 0,
                    maxSize: 255,

                },

            },

            options:{
                hashing:{
                    enabled: false,
                },
            },


        }, schema, false), data, type, creationOptions);

    }



}