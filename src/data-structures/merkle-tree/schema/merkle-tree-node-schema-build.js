const DBSchemaBuild = require('../../../db/db-generic/schemas/db-schema-build')
const Helper = require ('../../../helpers/helper')
const MerkleTreeNodeTypeEnum = require( "../merkle-tree-node-type-enum")
const CryptoHelper = require("../../../helpers/crypto/crypto-helper");

class MerkleTreeNodeSchemaBuild extends DBSchemaBuild {

    constructor(schema = {} ){

        super( Helper.merge({

            fields: {

                table: {
                    default: "mNode",
                    minSize: 5,
                    maxSize: 5,
                },

                id: {
                    default (){
                        return this.height.toString();
                    },
                    minSize: 0,
                    maxSize: 15,

                    unique: true,
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
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned ;
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

                    modelClass: undefined, //MerkleTreeNodeModel, //avoiding circular references

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
                    minSize: 32,
                    maxSize: 32,

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

module.exports = {
    MerkleTreeNodeSchemaBuild,
    MerkleTreeNodeSchemaBuilt: new MerkleTreeNodeSchemaBuild(),
}