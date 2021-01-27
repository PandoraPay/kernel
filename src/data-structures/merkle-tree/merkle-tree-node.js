const Helper = require( "../../helpers/helper");
const DBMarshal = require( "../../db/db-generic/db-marshal")
const Exception = require("../../helpers/exception");

const MarshalFields = require( "../../marshal/fields/marshal-fields");

const MerkleTreeNodeTypeEnum = require( "./merkle-tree-node-type-enum")
const CryptoHelper = require("../../helpers/crypto/crypto-helper");

module.exports = class MerkleTreeNode extends DBMarshal {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "mNode",
                    fixedBytes: 5,
                },

                id: {
                    default(){
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
                        return (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF && !this.__data.pruned) ? 1 : 0;
                    },

                    maxSize(){
                        return (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF && !this.__data.pruned) ? 1<<18 - 1 : 0;
                    },

                    skipHashing(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned;
                    },

                    skipSaving(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned;
                    },

                    skipMarshal(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned;
                    },

                    position: 101,
                },

                children:{
                    
                    type: "array",
                    schemaClass: MerkleTreeNode,
                    
                    minSize: 0,
                    maxSize(){
                        return (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE && !this.__data.pruned) ? 1<<18 - 1 : 0;
                    },

                    skipHashing(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF && !this.__data.pruned;
                    },

                    skipSaving(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF || this.__data.pruned;
                    },

                    skipMarshal(){
                        return this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF || this.__data.pruned;
                    },

                    position: 102,
                },


                prunedHash: {

                    type: "buffer",
                    fixedBytes: 32,

                    skipHashing(){ return !this.pruned; },
                    skipMarshal(){ return !this.pruned; },

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
                        return this.pruned ? this.prunedHash : undefined ;
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

        }, schema, false), data, type, creationOptions);


    }


    init(){
        this.tree = this._scope.parent.tree;

        this.height = this.tree.levelsCounts[ this._scope.parent.level + 1 ]++;
        this.level = this._scope.parent.level + 1;

        if (this.level === this.tree.levels )
            this.type = MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF;
        else
            this.type = MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE;
    }

    fillMerkleTreeNode(data, offset = 0,  levels){
        
        let newLevel = this.level + 1;

        const childrenNew = this.__data.children.slice();

        if (this.level < levels && data[ offset ]) {

            const left = this._createSchemaObject( {
                data:  newLevel === levels ? data[offset] : undefined,
            }, "object", "children", undefined, undefined, undefined, {}  );

            if ( newLevel  === levels) offset++;
            else offset = left.fillMerkleTreeNode(data, offset, levels);

            childrenNew.push(left);

        }

        if ( this.level < levels && data[ offset ] ){

            const right = this._createSchemaObject( {
                data:  newLevel === levels ? data[offset] : undefined,
            }, "object", "children", undefined, undefined, undefined, {}  );

            if ( newLevel  === levels) offset++;
            else offset = right.fillMerkleTreeNode(data, offset , levels);

            childrenNew.push(right);

        }

        //make sure to trigger hash propagation
        this.children = childrenNew;
        return offset;

    }

    addChild(child){

        child._scope.parent = this;
        this.children = [...this.__data.children, child];

    }

    leaves(levels){

        if (this.level === levels)
            return [this];

        if (this.children.length === 0)
            return [];

        if (this.children.length === 1)
            return this.children[0].leaves(levels);

        if (this.children.length === 2)
            return this.children[0].leaves(levels).concat ( this.children[1].leaves(levels) )

        throw new Exception(this, "children as more than 2 children!!!");

    }
    
    BFS(){

        const queue = [this];
        for (let i=0; i < queue.length; i++ ){

            const node = queue[i];
            for (let j=0; j < node.children.length; j++)
                queue.push( node.children[j] )

        }
        
        return queue;

    }

    DFS(){
        if (this.children.length === 0)
            return [this];
        else
        if (this.children.length === 1)
            return this.children[0].DFS().concat ( this );
        else
        if (this.children.length === 2)
            return this.children[0].DFS().concat ( this.children[1].DFS() , this);
    }
    
}


