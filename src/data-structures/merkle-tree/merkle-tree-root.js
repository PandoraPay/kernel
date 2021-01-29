const MerkleTreeNode = require( "./merkle-tree-node");
const MerkleTreeNodeTypeEnum = require( "./merkle-tree-node-type-enum");
const {SchemaBuiltMerkleTreeRoot} = require('./schema/schema-build-merkle-tree-root')

module.exports = class MerkleTreeRoot extends MerkleTreeNode {
    
    constructor(scope, schema = SchemaBuiltMerkleTreeRoot,  data, type, creationOptions ){
        super(scope, schema, data, type, creationOptions);
    }
    
    init(){
        this.tree = this._scope.parent;

        this.level = 0;
        this.height = 0;

        if (this.tree.count === 0 )
            this.type = MerkleTreeNodeTypeEnum.MERKLE_TREE_EMPTY_ROOT_LEAF;
        else
            this.type = MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE;
    }

    leaves(levels) {

        if (this.children.length === 0) return [];

        return super.leaves.call(this, levels);

    }

}


