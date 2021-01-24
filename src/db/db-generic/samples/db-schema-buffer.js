const Helper = require.main.require( "./src/helpers/helper");
const DBSchema = require( "../db-schema");

module.exports = class DBSchemaBuffer extends DBSchema {

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
