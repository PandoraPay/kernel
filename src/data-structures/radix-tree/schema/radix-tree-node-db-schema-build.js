const DBSchemaBuild = require('../../../db/db-generic/db-schema-build')
const Helper = require ('../../../helpers/helper')
const {SchemaBuiltBuffer} = require( "../../../marshal/schemas/samples/schema-build-buffer" );
const {SchemaBuiltString} = require("../../../marshal/schemas/samples/schema-build-string");
const CryptoHelper = require( "../../../helpers/crypto/crypto-helper");
const RadixTreeNodeTypeEnum = require('../radix-tree-node-type-enum')

class RadixTreeNodeDBSchemaBuild extends DBSchemaBuild {

    constructor(schema = {}){

        super( Helper.merge({

            fields: {

                table: {
                    default: "node",
                    fixedBytes: 4,
                },

                /**
                 * Required to retrieve its parents
                 */

                label: {

                    type: "string",
                    minSize: 1,
                    maxSize: 40,

                    default(){
                        return this._scope.parent.childrenLabels[this._scope.parentIndex];
                    },

                    setEvent(label){

                        if (this.type !== undefined) this.type = this.getType();
                        if (this.id) this.id = this.getNewId();

                    },

                    skipHashing: true,
                    skipMarshal: true,

                    position: 101,
                },

                id:{

                    minSize: 4,
                    maxSize: 80,

                    default(){
                        return this.getNewId();
                    },

                    unique: true,

                    position: 102,

                },

                type: {
                    type: "number",
                    default(){
                        return this.getType();
                    },

                    position: 103,
                },

                pruned: {
                    type: "boolean",

                    default: false,

                    skipHashing: true,
                    skipMarshal: true,

                    position: 104,

                },

                data: {

                    type: "buffer",
                    minSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.pruned ? 1 : 0;
                    },

                    maxSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.pruned ? 262143 : 0;
                    },

                    skipHashing(){ return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.pruned ); },
                    skipSaving() { return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.pruned ); },
                    skipMarshal(){ return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.pruned ); },

                    position: 105,
                },

                childrenCount:{

                    type: "number",

                    minSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.pruned ? 1 : 0;
                    },

                    maxSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.pruned ? 16 : 0;
                    },

                    position: 106,

                },


                childrenLabels: {

                    type: "array",
                    schemaBuiltClass: SchemaBuiltString,

                    fixedBytes(){ return this.childrenCount },

                    skipHashing(){ return this.pruned },
                    skipSaving(){ return this.pruned },
                    skipMarshal(){ return this.pruned },

                    position: 107,

                },

                childrenHashes:{

                    type: "array",
                    schemaBuiltClass: SchemaBuiltBuffer,

                    fixedBytes(){ return this.childrenCount; },

                    skipHashing(){ return this.pruned },
                    skipSaving(){ return this.pruned },
                    skipMarshal(){ return this.pruned },

                    position: 108,
                },


                prunedHash: {

                    type: "buffer",
                    fixedBytes: 32,

                    skipHashing(){ return !this.pruned; },
                    skipMarshal(){ return !this.pruned; },

                    getter(){
                        return this.pruned ? this.__data.prunedHash : this.hash();
                    },

                    position: 109,
                },



            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    returnSpecificHash(){
                        return this.pruned ? this.__data.prunedHash : undefined ;
                    },

                    fct: CryptoHelper.sha256

                },

            },

            saving: {

                saveInfixParentTable: false,
                indexableById: false,

                /**
                 * scan is not supported because of disabling indexable by id
                 */
            }

        }, schema, true));

    }

}

module.exports = {
    RadixTreeNodeDBSchemaBuild,
    RadixTreeNodeDBSchemaBuilt: new RadixTreeNodeDBSchemaBuild()
}