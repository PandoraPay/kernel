const Exception = require("../../helpers/exception");

const RadixTreeModel = require("./radix-tree-model");
const RadixTreeNodeTypeEnum = require('./radix-tree-node-type-enum')

/**
 * IT IS NOT WORKING
 */

module.exports = class RadixTreeVirtualModel extends RadixTreeModel {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope,schema, data, type, creationOptions);

        this._maps = {};

        //fallbacks allow to virtualize and virtualTree
        this._fallback = undefined;

    }
    _getFallback(method){
        if (this._fallback) return this._fallback[method].bind(this._fallback);
        return super[method].bind(this);
    }

    createEmptyChild(  parent, position){

        const child = super.createEmptyChild(parent, position);

        this._maps[child.labelCompleteFast() ] = {
            type: "created",
            node: child,
        }
        return child;
    }

    createDataChild( parent, data, position){

        const child = super.createDataChild(parent, data, position);
        this._maps[child.labelCompleteFast() ] = {
            type: "created",
            node: child,
        }

        return child;
    }

    async _deleteNode(node){

        this._maps[node.labelCompleteFast() ] = {
            type: "deleted",
            node,
        }

        if (node.children.length)
            throw new Exception(this, 'it should have no child');

    }

    async _saveNode(node){
    }

    /**
     * Find Radix should not be changed !!!
     * It will load the matching node. The memory nodes are updated
     * @param label
     * @returns {Promise<*>}
     */
    async findRadix(label){
        return super.findRadix(label);
    }


    async findRadixLeaf(label) {

        label = this.processLeafLabel(label);

        if (this._maps[label]) {
            if (this._maps[label].type === "deleted") return;
            return this._maps[label].node;
        }

        return this._getFallback('findRadixLeaf')(label);
    }


    async loadNodeChild(label, position, parent){
        return this._getFallback('loadNodeChild')(label, position, parent);
    }

    async _clearDeletedElements(){
        const promises = [];

        for (const key in this._maps)
            if (this._maps[key].type === "deleted")
                promises.push( this._maps[key].node.delete() );

        await Promise.all(promises);
        this._maps = {};
    }

    //will empty only the local changes
    async clearTree(){

        await this._clearDeletedElements();

        return this._getFallback('clearTree')();
    }

    resetTree(){
        this._maps = {};
        return this._getFallback('resetTree')();
    }

    async saveTree(){
        await this.saveVirtualRadix();
    }

    async saveVirtualRadix(){
        await this._clearDeletedElements();
        return this.root.save();
    }

}