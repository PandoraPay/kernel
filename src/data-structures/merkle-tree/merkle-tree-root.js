const Helper = require( "../../helpers/helper");
const MerkleTreeNode = require( "./merkle-tree-node");
const MerkleTreeNodeTypeEnum = require( "./merkle-tree-node-type-enum");

module.exports = class MerkleTreeRoot extends MerkleTreeNode {
    
    constructor(scope, schema,  data, type, creationOptions ){

        super(scope, Helper.merge({

            saving: {

                saveInfixParentTable: true,
                saveInfixParentId: true,

            }

        }, schema, false), data, type, creationOptions);

    }
    
    init(){
        this.tree = this._scope.parent;

        this.level = 0;
        this.height = 0;

        if (this.tree.count === 0 )
            this.type = MerkleTreeNodeTypeEnum.MERKLE_TREE_LEAF;
        else
            this.type = MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE;
    }

    leaves(levels) {

        if (this.children.length === 0) return [];

        return super.leaves.call(this, levels);

    }

}


