const MerkleTreeNodeModel = require( "./merkle-tree-node-model");
const MerkleTreeNodeTypeEnum = require( "./merkle-tree-node-type-enum");
const {MerkleTreeRootSchemaBuilt} = require('./schema/merkle-tree-root-schema-build')


module.exports = class MerkleTreeRootModel extends MerkleTreeNodeModel {
    
    constructor(scope, schema = MerkleTreeRootSchemaBuilt,  data, type, creationOptions ){
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


MerkleTreeRootSchemaBuilt.fields.children.modelClass = MerkleTreeNodeModel;


