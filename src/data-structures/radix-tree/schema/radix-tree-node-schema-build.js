const DBSchemaBuild = require('../../../db/db-generic/schemas/db-schema-build')
const Helper = require ('../../../helpers/helper')
const {RadixHashBufferSchemaBuilt} = require( "./data/radix-hash-buffer-schema-build" );
const {RadixLabelStringSchemaBuilt} = require("./data/radix-label-string-schema-build");
const CryptoHelper = require( "../../../helpers/crypto/crypto-helper");
const RadixTreeNodeTypeEnum = require('../radix-tree-node-type-enum')

class RadixTreeNodeSchemaBuild extends DBSchemaBuild {

    constructor(schema = {}){

        super( Helper.merge({

            fields: {

                table: {
                    default: "node",
                    minSize: 4,
                    maxSize: 4,
                },

                /**
                 * Required to retrieve its parents
                 */

                label: {

                    type: "string",
                    minSize: 1,
                    maxSize: 40,

                    default(){
                        return this._scope.parent.childrenLabels[this._scope.parentIndex].string;
                    },

                    setEvent(label){

                        if (this.type !== undefined) this.type = this.getType();
                        if (this.id) this.id = this.getNewId();

                    },

                    skipHashing: true,
                    skipMarshal: true,

                    position: 101,
                },

                type: {
                    type: "number",
                    default(){
                        return this.getType();
                    },

                    skipHashing: true,
                    skipSaving: true,
                    skipMarshal: true,

                    position: 102,
                },

                id:{

                    minSize: 4,
                    maxSize: 80,

                    default(){
                        return this.getNewId();
                    },

                    unique: true,

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
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.__data.pruned ? 1 : 0;
                    },

                    maxSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.__data.pruned ? 262143 : 0;
                    },

                    skipHashing(){ return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.__data.pruned ); },
                    skipSaving() { return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.__data.pruned ); },
                    skipMarshal(){ return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.__data.pruned ); },

                    position: 105,
                },

                childrenCount:{

                    type: "number",

                    minSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.__data.pruned ? 1 : 0;
                    },

                    maxSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.__data.pruned ? 16 : 0;
                    },

                    position: 106,
                },


                childrenLabels: {

                    type: "array",
                    schemaBuiltClass: RadixLabelStringSchemaBuilt,

                    default: [],

                    minSize(){ return this.__data.childrenCount },
                    maxSize(){ return this.__data.childrenCount },

                    skipHashing(){ return this.__data.pruned },
                    skipSaving(){ return this.__data.pruned },
                    skipMarshal(){ return this.__data.pruned },

                    position: 107,

                },

                children: {
                    type: "array",

                    modelClass: undefined,

                    default: [],

                    minSize(){ return this.__data.childrenCount },
                    maxSize(){ return this.__data.childrenCount },

                    skipHashing(){ return this.__data.pruned },
                    skipSaving(){ return this.__data.pruned },
                    skipMarshal(){ return this.__data.pruned },

                    position: 108,
                },

                childrenHashes:{

                    type: "array",
                    schemaBuiltClass: RadixHashBufferSchemaBuilt,

                    default: [],

                    minSize(){ return this.__data.childrenCount; },
                    maxSize(){ return this.__data.childrenCount; },

                    skipHashing(){ return this.__data.pruned },
                    skipSaving(){ return this.__data.pruned },
                    skipMarshal(){ return this.__data.pruned },

                    position: 109,
                },

                prunedHash: {

                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    skipHashing(){ return !this.__data.pruned; },
                    skipMarshal(){ return !this.__data.pruned; },

                    getter(){
                        return this.__data.pruned ? this.__data.__data.prunedHash : this.hash();
                    },

                    position: 110,
                },



            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    returnSpecificHash(){
                        return this.__data.pruned ? this.__data.prunedHash : undefined ;
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
    RadixTreeNodeSchemaBuild,
    RadixTreeNodeSchemaBuilt: new RadixTreeNodeSchemaBuild()
}