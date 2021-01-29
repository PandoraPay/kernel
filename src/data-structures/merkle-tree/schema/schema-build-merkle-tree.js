const DBSchemaBuild = require('../../../db/db-generic/db-schema-build')
const Helper = require ('../../../helpers/helper')

const {SchemaBuiltMerkleTreeRoot} = require('./schema-build-merkle-tree-root');
const MerkleTreeRoot = require('./../merkle-tree-root')

class SchemaBuildMerkleTree extends DBSchemaBuild{

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

                        this.root = this._createMarshalObject(undefined, undefined, "root");
                        this._calculateLevelsCounts(count);

                        if (this._countChanged) this._countChanged( count );
                    },

                    position: 101,

                },

                root:{
                    type: "object",
                    schemaBuiltClass: SchemaBuiltMerkleTreeRoot,
                    marshalClass: MerkleTreeRoot,

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
    SchemaBuildMerkleTree,
    SchemaBuiltMerkleTree: new SchemaBuildMerkleTree(),
}