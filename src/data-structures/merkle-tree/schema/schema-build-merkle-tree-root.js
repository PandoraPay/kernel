const {SchemaBuildMerkleTreeNode} = require('./schema-build-merkle-tree-node')
const Helper = require( "../../../helpers/helper");


class SchemaBuildMerkleTreeRoot extends SchemaBuildMerkleTreeNode {

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
    SchemaBuildMerkleTreeRoot,
    SchemaBuiltMerkleTreeRoot: new SchemaBuildMerkleTreeRoot()
}