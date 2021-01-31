const {MerkleTreeNodeDBSchemaBuild} = require('./merkle-tree-node-db-schema-build')
const Helper = require( "../../../helpers/helper");


class MerkleTreeRootDBSchemaBuild extends MerkleTreeNodeDBSchemaBuild {

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
    MerkleTreeRootDBSchemaBuild,
    MerkleTreeRootDBSchemaBuilt: new MerkleTreeRootDBSchemaBuild()
}