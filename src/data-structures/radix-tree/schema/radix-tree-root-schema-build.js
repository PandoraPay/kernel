const Helper = require ('../../../helpers/helper')
const RadixTreeNodeTypeEnum = require("./../radix-tree-node-type-enum");
const {RadixTreeNodeSchemaBuild} = require('./radix-tree-node-schema-build')

class RadixTreeRootSchemaBuild extends RadixTreeNodeSchemaBuild {

    constructor(schema = {}) {

        super(Helper.merge({

            fields: {

                label: {
                    minSize: 0,
                    maxSize: 40,
                    default: '',
                },

                childrenCount:{
                    minSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.__data.pruned ? 0 : 0;
                    },

                    maxSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.__data.pruned ? 16 : 0;
                    },
                },

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