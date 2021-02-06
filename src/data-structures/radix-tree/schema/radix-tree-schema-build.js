const DBSchemaBuild = require('../../../db/db-generic/schemas/db-schema-build')
const Helper = require ('../../../helpers/helper')

const {RadixTreeRootDBSchemaBuilt} = require('./radix-tree-root-db-schema-build')
const RadixTreeRootModel = require('../radix-tree-root-model')

class RadixTreeSchemaBuild extends DBSchemaBuild {

    constructor(schema = {}) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "radix",
                    minSize: 5,
                    maxSize: 5,
                },

                id:{
                    default: "radixTree",
                    minSize: 9,
                    maxSize: 9,
                    position: 100,
                },

                root: {
                    type: "object",
                    modelClass: RadixTreeRootModel,

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
    RadixTreeSchemaBuild,
    RadixTreeSchemaBuilt: new RadixTreeSchemaBuild(),
}