const Exception = require("../../helpers/exception");

const RadixTree = require("./radix-tree-model");
const RadixTreeNodeModel = require( "./radix-tree-node-model");
const RadixTreeRootModel = require("./radix-tree-root-model");

/**
 * IT IS NOT WORKING
 */

module.exports = class RadixTreeVirtualModel extends RadixTree{

    constructor(scope, schema, data, type, creationOptions) {

        super(scope,schema, data, type, creationOptions);

        this._maps = {};

        //falbacks allow to virtualize and virtualTree
        this._fallback = undefined;

    }

    _getFallback(method){
        if (this._fallback) return this._fallback[method].bind(this._fallback);
        return super[method].bind(this);
    }

    async _saveMap(type = "deleted", node){

        const queue = [node];
        for (let i=0; i < queue.length; i++){

            let current = queue[i];

            if ( (type === "saved" || type === "view") && !current.isChanged() ) continue;

            const label = current.labelCompleteFast();

            this._maps[ label ] = {
                type,
                node: current,
            };

            if (type === "deleted")
                await current.loadChildren();

            for (let j=0; j < current.__data.childrenCount; j++)
                if (current.children[j])
                    queue.push( current.children[j] );
        }

        return node;

    }

    async _deleteNode(node){
        return this._saveMap("deleted", node);
    }

    async _saveNode(node){
        return this._saveMap("saved", node);
    }

    /**
     * Find Radix should not be changed !!!
     * It will load the matching node. The memory nodes are updated
     * @param label
     * @returns {Promise<*>}
     */
    async findRadix(label){

        return this._getFallback('findRadix')(label);

    }

    _getNode(label){

        const element = this._maps[label];

        if (element){

            if (element.type === "deleted") return {out: undefined};
            else if (element.type === "saved" || element.type === "view") return {out: element.node};

        }


    }

    async findRadixLeaf(label) {

        label = this.processLeafLabel(label);

        const found = this._getNode(label);
        if (found) return found.out;

        return this._getFallback('findRadixLeaf')(label);
    }

    async saveVirtualRadix(resetVirtualRadix){

        const saveMap =  {};
        for (const key in this._maps )
            saveMap[key] = this._maps[key];

        const promises = [];
        for (const key in saveMap){

            const element = saveMap[key];

            if (element.type === "deleted")
                await element.node.delete();
                //promises.push( element.node.delete() );
            else
            if (element.type === "saved")
                await element.node.save();
                //promises.push( element.node.save() );
            else
                if (element.type === "view") continue; //nothing for view

        }

        await Promise.all(promises);

        if (resetVirtualRadix)
            this._maps = {};
        else
            return this._saveMap("view", this.root);

    }

    async loadNodeChild(label, position, parent){

        const labelComplete = parent.labelCompleteFast() + label;

        const found = this._getNode(labelComplete);
        if (found) return found.out;

        const child = await this._getFallback('loadNodeChild')(label, position, parent);

        if (child)
            this._maps[labelComplete] = {
                type: "view",
                node: child,
            };

        return child;
    }

    //will empty only the local changes
    async clearTree(){

        const promises = [];

        for (const key in this._maps)
            if (this._maps[key].type === "deleted")
                await this._maps[key].node.delete();
                //promises.push( this._maps[key].node.delete() );

        await Promise.all(promises);

        this._maps = {};

        await this._getFallback('clearTree')();

    }

    resetTree(){
        this._maps = {};
        return this._getFallback('resetTree')();
    }

    async saveTree(){
        await this.saveVirtualRadix();
    }

    //used for testing
    validateVirtualMap(){

        for (const key in this._maps) {

            const node = this._maps[key].node;

            if (node) {

                if (node.parent.childrenLabels && this._maps[key].type !== "deleted") {

                    let parentIndex = -1;
                    const parent = node.parent;
                    for (let i = 0; i < parent.children.length; i++)
                        if (parent.children[i] === node) {
                            if (parentIndex !== -1) throw new Exception(this, "children found twice");
                            parentIndex = i;
                        }

                    if (parentIndex !== node.parentIndex) throw new Exception(this, "children parentIndex is not matching");
                    if (node.label !== node.parent.childrenLabels[parentIndex].string) throw new Exception(this, "children label is not matching")

                }

                if (key.length === 40)
                    if (node && (node.childrenCount > 0 || node.data === null ))
                        throw new Exception(this, "validateVirtualMap raised an error", {key, node});


                if (node.id.indexOf(key) < 0)
                    throw new Exception(this, "validateVirtualMap raised an error2", {key, node});

                if ( this._maps[key].type !== "deleted" && !(node instanceof RadixTreeRootModel) && node.parent instanceof RadixTreeNodeModel   )
                    if (node.parent.childrenLabels[ node.parentIndex ].string !== node.label)
                        throw new Exception(this, "validateVirtualMap raised an error3", {key, node})


            }

        }

        return true;

    }

}