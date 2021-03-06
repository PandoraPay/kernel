const DBModel = require( "../../db/db-generic/db-model")
const Exception = require("../../helpers/exception");

const MerkleTreeNodeTypeEnum = require( "./merkle-tree-node-type-enum")
const {MerkleTreeNodeSchemaBuilt} = require('./schema/merkle-tree-node-schema-build')

class MerkleTreeNodeModel extends DBModel {

    constructor(scope, schema = MerkleTreeNodeSchemaBuilt,  data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
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

            const left = this._createModelObject( {
                data:  newLevel === levels ? data[offset] : undefined,
            }, "object", "children" );

            if ( newLevel  === levels) offset++;
            else offset = left.fillMerkleTreeNode(data, offset, levels);

            childrenNew.push(left);

        }

        if ( this.level < levels && data[ offset ] ){

            const right = this._createModelObject( {
                data:  newLevel === levels ? data[offset] : undefined,
            }, "object", "children" );

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
        child._scope.parentIndex = this.__data.children.length;
        this.children = [...this.__data.children, child];

    }

    leaves(levels){

        if (this.level === levels)
            return [this];

        if (this.__data.children.length === 0)
            return [];

        if (this.__data.children.length === 1)
            return this.__data.children[0].leaves(levels);

        if (this.__data.children.length === 2)
            return this.__data.children[0].leaves(levels).concat ( this.__data.children[1].leaves(levels) )

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
        if (this.__data.children.length === 0)
            return [this];
        else
        if (this.__data.children.length === 1)
            return this.__data.children[0].DFS().concat ( this );
        else
        if (this.__data.children.length === 2)
            return this.__data.children[0].DFS().concat ( this.__data.children[1].DFS() , this);
    }
    
}

MerkleTreeNodeSchemaBuilt.fields.children.modelClass = MerkleTreeNodeModel;

module.exports = MerkleTreeNodeModel;