import RadixTree from "./radix-tree";
import Exception from "src/helpers/exception";
import RadixTreeNode from "./radix-tree-node";
import RadixTreeRoot from "./radix-tree-root";

/**
 * IT IS NOT WORKING
 */

export default class RadixTreeVirtual extends RadixTree{

    constructor(scope, schema, data, type, creationOptions) {

        super(scope,schema, data, type, creationOptions);

        this._maps = {};

        //falbacks allow to virtualize and virtualTree
        this._fallback = undefined;

    }

    _getFallback(method){
        if (this._fallback) return this._fallback[method];
        return super[method].bind(this);
    }

    async _saveMap(type = "deleted", node){

        const queue = [node];
        for (let i=0; i < queue.length; i++){

            let current = queue[i];

            if ( (type === "save" || type === "view") && !current.isChanged() ) continue;

            const label = current.labelCompleteFast();

            this._maps[ label ] = {
                type,
                node: current,
            };

            if (type === "delete")
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

        let out;

        const element = this._maps[label];

        if (element){

            if (element.type === "deleted") out = {out: undefined};
            else if (element.type === "saved" || element.type === "view") out = {out: element.node};

        }


        return out;
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

        for (const key in saveMap){

            const element = saveMap[key];

            if (element.type === "deleted")
                await element.node.delete();
            else
            if (element.type === "saved")
                await element.node.save();
            else
                if (element.type === "view") continue; //nothing for view

        }

        if (resetVirtualRadix)
            this._maps = {};

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

        for (const key in this._maps)
            if (this._maps[key].type === "deleted")
                await this._maps[key].node.delete();

        this._maps = {};

        await this._getFallback('clearTree')();

        this._maps = {};

    }

    resetTree(){
        this._maps = {};
        return this._getFallback('resetTree')();
    }

    async saveTree(){
        await this.saveVirtualRadix();
    }

    validateVirtualMap(){

        for (const key in this._maps) {

            const node = this._maps[key].node;

            if (node) {
                if (key.length === 40)
                    if (node && (node.childrenCount > 0 || node.data === null ))
                        throw new Exception(this, "validateVirtualMap raised an error", {key, node});


                if (node.id.indexOf(key) < 0)
                    throw new Exception(this, "validateVirtualMap raised an error2", {key, node});

                if ( this._maps[key].type !== "deleted" && (node instanceof RadixTreeRoot === false ) && node.parent instanceof RadixTreeNode   )
                    if (node.parent.childrenLabels[ node.parentIndex ].string !== node.label)
                        throw new Exception(this, "validateVirtualMap raised an error3", {key, node})


            }

        }

        return true;

    }

}