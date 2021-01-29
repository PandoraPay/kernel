const DBSchemaBuild = require('../../../db/db-generic/db-schema-build')
const Helper = require ('../../../helpers/helper')
const MerkleTreeNodeTypeEnum = require( "../merkle-tree-node-type-enum")
const CryptoHelper = require("../../../helpers/crypto/crypto-helper");
const MerkleTreeNode = require('../merkle-tree-node')

let SchemaBuiltMerkleTreeNode;

class SchemaBuildMerkleTreeNode extends DBSchemaBuild {

    constructor(schema = {}){

        super( Helper.merge({

            fields: {

                table: {
                    default: "mNode",
                    fixedBytes: 5,
                },

                id: {
                    default (){
                        return this.height.toString();
                    },
                    minSize: 0,
                    maxSize: 15,

                    unique: false,
                },

                pruned: {
                    type: "boolean",
                    default: false,

                    skipHashing: true,

                    position: 100,
                },

                data: {

                    type: "buffer",
                    minSize(){
                        return (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF && !this.__data.pruned &&
                               this.type !==  MerkleTreeNodeTypeEnum.MERKLE_TREE_EMPTY_ROOT_LEAF) ? 1 : 0
                    },

                    maxSize(){
                        return (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF && !this.__data.pruned &&
                                this.type !== MerkleTreeNodeTypeEnum.MERKLE_TREE_EMPTY_ROOT_LEAF) ? 1<<18 - 1 : 0
                    },

                    skipHashing(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned;
                    },

                    skipSaving(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned;
                    },

                    skipMarshal (){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned;
                    },

                    position: 101,
                },

                children:{

                    type: "array",

                    schemaBuiltClass(){
                        return SchemaBuiltMerkleTreeNode;
                    },
                    marshalClass: MerkleTreeNode,

                    minSize: 0,
                    maxSize(){
                        return (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE && !this.__data.pruned &&
                                this.type !== MerkleTreeNodeTypeEnum.MERKLE_TREE_EMPTY_ROOT_LEAF) ? 2 : 0
                    },

                    skipHashing(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF && !this.__data.pruned;
                    },

                    skipSaving(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF || this.__data.pruned;
                    },

                    skipMarshal(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF || this.__data.pruned
                    },

                    position: 102,
                },


                prunedHash: {

                    type: "buffer",
                    fixedBytes: 32,

                    skipHashing(){
                        return !this.pruned;
                    },
                    skipMarshal(){
                        return !this.pruned;
                    },

                    getter(){
                        return this.pruned ? this.__data.prunedHash : this.hash();
                    },

                    position: 1000,
                },



            },

            options: {

                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    returnSpecificHash(){
                        return this.pruned ? this.prunedHash : undefined;
                    },

                    fct: CryptoHelper.sha256,

                },

            },

            saving: {
                saveInfixParentTable: false,
                indexableById: false,
                /**
                 * scan is not supported because of disabling indexable by id
                 */
            }

        }, schema, true ) );

    }

}

SchemaBuiltMerkleTreeNode = new SchemaBuildMerkleTreeNode();

module.exports = {
    SchemaBuildMerkleTreeNode,
    SchemaBuiltMerkleTreeNode,
}