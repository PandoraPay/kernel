const DBSchema = require( "../../db/db-generic/db-schema" );
const Helper = require( "../../helpers/helper");
const Exception = require("../../helpers/exception");

module.exports = class HashMapElement extends DBSchema {

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