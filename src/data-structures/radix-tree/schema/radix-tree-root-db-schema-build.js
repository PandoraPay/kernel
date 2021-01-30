const DBSchemaBuild = require('../../../db/db-generic/schemas/db-schema-build')
const Helper = require ('../../../helpers/helper')
const RadixTreeNodeTypeEnum = require("./../radix-tree-node-type-enum");
const {RadixTreeNodeDBSchemaBuild} = require('./radix-tree-node-db-schema-build')

class RadixTreeRootDBSchemaBuild extends RadixTreeNodeDBSchemaBuild {

    constructor(schema = {}) {

        super(Helper.merge({

            fields: {

                id:{
                    default(){
                        return this.parent.id+":root";
                    },
                },

                label: {
                    minSize: 0,
                    maxSize: 0,
                    default(){
                        return '';
                    }
                },

                type: {
                    default(){
                        return this.label.length === 40 ? RadixTreeNodeTypeEnum.RADIX_TREE_LEAF : RadixTreeNodeTypeEnum.RADIX_TREE_NODE;
                    },
                },

                childrenCount: {

                    minSize() {
                        return 0;
                    },

                },

                data: undefined,

            },

            saving: {
                saveInfixParentTable: true,
                saveInfixParentId: true,
            }

        }, schema, true));

    }

}

module.exports = {
    RadixTreeRootDBSchemaBuild,
    RadixTreeRootDBSchemaBuilt: new RadixTreeRootDBSchemaBuild()
}