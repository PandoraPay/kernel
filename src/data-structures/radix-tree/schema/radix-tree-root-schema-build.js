const Helper = require ('../../../helpers/helper')
const RadixTreeNodeTypeEnum = require("./../radix-tree-node-type-enum");
const {RadixTreeNodeSchemaBuild} = require('./radix-tree-node-schema-build')

class RadixTreeRootSchemaBuild extends RadixTreeNodeSchemaBuild {

    constructor(schema = {}) {

        super(Helper.merge({

            fields: {

                label: {
                    minSize: 0,
                    maxSize: 0,
                    default: '',
                },

                type: {
                    default: RadixTreeNodeTypeEnum.RADIX_TREE_NODE,
                },

                data: undefined,

                childrenCount: {
                    minSize: 0,
                }

            },

            saving: {
                saveInfixParentTable: true,
                saveInfixParentId: true,
            }

        }, schema, true));

    }

}

module.exports = {
    RadixTreeRootSchemaBuild,
    RadixTreeRootSchemaBuilt: new RadixTreeRootSchemaBuild()
}