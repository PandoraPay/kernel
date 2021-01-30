const DBSchemaBuild = require('../../../db/db-generic/db-schema-build')
const Helper = require ('../../../helpers/helper')

const {RadixTreeRootDBSchemaBuilt} = require('./radix-tree-root-db-schema-build')
const RadixTreeRootDBModel = require('../radix-tree-root-db-model')

class RadixTreeDBSchemaBuild extends DBSchemaBuild {

    constructor(schema = {}) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "radix",
                    fixedBytes: 5,
                },

                id:{
                    default: "radixTree",
                    fixedBytes: 9,
                    position: 100,
                },

                root: {
                    type: "object",
                    schemaBuiltClass: RadixTreeRootDBSchemaBuilt,
                    modelClass: RadixTreeRootDBModel,

                    position: 101,
                },

            },

            options: {
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,

                    /**
                     * Disable Hashing function to avoid hashing the root hash
                     */

                    fct: b => b,
                },
            },

            saving: {

                saveInfixParentId: true,

            }


        }, schema, true));

    }

}

module.exports = {
    RadixTreeDBSchemaBuild,
    RadixTreeDBSchemaBuilt: new RadixTreeDBSchemaBuild(),
}