const {MerkleTreeNodeSchemaBuild} = require('./merkle-tree-node-db-schema-build')
const Helper = require( "../../../helpers/helper");


class MerkleTreeRootDBSchemaBuild extends MerkleTreeNodeSchemaBuild {

    constructor(schema = {}){
        super(Helper.merge({

            saving: {

                saveInfixParentTable: true,
                saveInfixParentId: true,

            }

        }, schema, true));
    }

}

module.exports = {
    MerkleTreeRootDBSchemaBuild: MerkleTreeRootDBSchemaBuild,
    MerkleTreeRootDBSchemaBuilt: new MerkleTreeRootDBSchemaBuild()
}