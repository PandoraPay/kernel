const DBSchemaBuild = require('../../../db/db-generic/schemas/db-schema-build')
const Helper = require ('../../../helpers/helper')

const {MerkleTreeRootSchemaBuilt} = require('./merkle-tree-root-schema-build');
const MerkleTreeRootModel = require('../merkle-tree-root-model')

class MerkleTreeSchemaBuild extends DBSchemaBuild{

    constructor(schema = {}) {
        super(Helper.merge({

            fields: {

                table: {
                    default: "merkle",
                    fixedBytes: 6,
                },

                id: {
                    position: 100,
                },

                count:{
                    type: "number",
                    skipHashing: true,

                    setEvent(count ){
                        if (count === 0) this.levels = 0;
                        else if (count === 1) this.levels = 1;
                        else this.levels = Math.ceil ( Math.log2( count ) );

                        this.root = this._createModelObject(undefined, undefined, "root");
                        this._calculateLevelsCounts(count);

                        if (this._countChanged) this._countChanged( count );
                    },

                    position: 101,

                },

                root:{
                    type: "object",
                    schemaBuiltClass: MerkleTreeRootSchemaBuilt,
                    modelClass: MerkleTreeRootModel,

                    setEvent(root){
                        this._leaves = undefined;
                        this._leavesNonPruned = undefined;
                    },

                    position: 102,
                },

            },

            options: {

                hashing: {
                    enabled: true,
                    fct: b => b,

                    parentHashingPropagation: true,
                },

            },

            saving: {

                saveInfixParentId: true,

            }

        }, schema, true));
    }

}

module.exports = {
    MerkleTreeSchemaBuild,
    MerkleTreeSchemaBuilt: new MerkleTreeSchemaBuild(),
}