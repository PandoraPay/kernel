const DBSchemaBuild = require('../../../db/db-generic/db-schema-build')
const Helper = require ('../../../helpers/helper')

const {SchemaBuiltRadixTreeRoot} = require('./schema-build-radix-tree-root')
const RadixTreeRoot = require('./../radix-tree-root')

class SchemaBuildRadixTree extends DBSchemaBuild {

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
                    schemaBuiltClass: SchemaBuiltRadixTreeRoot,
                    marshalClass: RadixTreeRoot,

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
    SchemaBuildRadixTree,
    SchemaBuiltRadixTree: new SchemaBuildRadixTree(),
}