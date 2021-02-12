const {MerkleTreeNodeSchemaBuild} = require('./merkle-tree-node-schema-build')
const Helper = require( "../../../helpers/helper");

class MerkleTreeRootSchemaBuild extends MerkleTreeNodeSchemaBuild {

    constructor(schema = {}){
        super(Helper.merge({

            saving: {
                saveInfixParentId: true,
            }

        }, schema, true));
    }

}

module.exports = {
    MerkleTreeRootSchemaBuild,
    MerkleTreeRootSchemaBuilt: new MerkleTreeRootSchemaBuild(),
}