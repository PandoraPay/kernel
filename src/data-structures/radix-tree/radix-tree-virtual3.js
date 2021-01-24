const Exception = require.main.require("./src/helpers/exception");

const RadixTree = require( "./radix-tree" );
const RadixTreeNode = require( "./radix-tree-node");
const RadixTreeNodeTypeEnum = require( "./radix-tree-node-type-enum");

/**
 * IT IS NOT WORKING
 */

module.exports = class RadixTreeVirtual3 extends RadixTree{

    constructor(scope, schema, data, type, creationOptions) {

        super(scope,schema, data, type, creationOptions);

        this._idsDeleted = {};

        this._idsAdded = {};
        this._nodesUpdating = {};

    }

    async addRadix(label, data, returnErrorIfFound){

        label = this.processLeafLabel(label);

        const found = this._idsAdded[label];
        if (found) {

            if (returnErrorIfFound)
                throw new Exception(this, "Radix Element already found");

            //update
            if (found.node._schema.fields.data.type === "object")
                found.data.fromType(data);
            else
                found.data = data;

            return found;

        }

        const out = await super.addRadix(label, data, returnErrorIfFound, false);

        if (this._idsDeleted[ label ] ) delete this._idsDeleted[ label ];
        if (this._idsDeleted[ out.getDelete().labelCompleteFast() ] ) delete this._idsDeleted[ out.getDelete().labelCompleteFast() ];


        this._idsAdded[ label ] = out;
        this._nodesUpdating[ label ] = out;

        if (this._nodesUpdating[ out.getDelete().labelCompleteFast() ] !== out) delete this._nodesUpdating[ out.getDelete().labelCompleteFast() ];
        if (this._nodesUpdating[ out.getDeleteUpdate().labelCompleteFast() ] !== out) delete this._nodesUpdating[ out.getDeleteUpdate().labelCompleteFast() ];

        return out;
    }

    async deleteRadix(label){

        label = this.processLeafLabel(label);

        if (this._idsDeleted[label]) return; //already deleted

        const out = await super.deleteRadix(  label, false );

        if (!out) return out;

        if (!this._idsDeleted[ label ]) this._idsDeleted[ label ] = out;
        if (!this._idsDeleted[ out.getDelete().labelCompleteFast() ] ) this._idsDeleted[ out.getDelete().labelCompleteFast() ] = out;

        delete this._idsAdded[ label ];
        delete this._nodesUpdating[ label ];

        this._nodesUpdating[ out.getDeleteUpdate().labelCompleteFast() ] = out.getDeleteUpdate();

        return out;
    }

    async findRadix(label){

        label = this.processLeafLabel(label);

        if (this._idsDeleted[label]) return; //already deleted
        if (this._idsAdded[label]) return this._idsAdded[label];

        return super.findRadix(label);
    }

    async findRadixLeaf(label) {

        label = this.processLeafLabel(label);

        if (this._idsDeleted[label]) return; //already deleted
        if (this._idsAdded[label]) return this._idsAdded[label];

        return super.findRadixLeaf(label);

    }

    async saveVirtualRadix(){

        const deleteIds = {} ;

        const promisesDelete = [];
        for (let id in this._idsDeleted ) {
            const objToDelete = this._createSimpleObject(this.root.nodeClass, "children", {
                label: Buffer.alloc(1),
                id: deleteIds[id].id,
            }, "object", undefined, {skipProcessingConstructionValues: true, skipValidation: true} );
            promisesDelete.push( objToDelete.delete() );
        }


        this._idsDeleted = {};

        const promisesDeleteOut = await Promise.all(promisesDelete);

        const updates = Object.values( this._nodesUpdating );

        await this.optimizedHashPropagation( updates.filter( it => it.type = RadixTreeNodeTypeEnum.RADIX_TREE_LEAF ) );

        return this.root.save();

    }


}