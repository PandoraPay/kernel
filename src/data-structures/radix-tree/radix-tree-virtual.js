import RadixTree from "./radix-tree";

/**
 * IT IS NOT WORKING
 */

export default class RadixTreeVirtual extends RadixTree{

    constructor(scope, schema, data, type, creationOptions) {

        super(scope,schema, data, type, creationOptions);

        this._maps = {};

    }

    async _saveMap(type = "deleted", node){

        const queue = [node];
        for (let i=0; i < queue.length; i++){

            let current = queue[i];

            if ( (type === "save" || type === "view") && !current.isChanged() ) continue;

            const label = current.labelCompleteFast();

            if ( this._maps[label] ){

                this._maps[label].type = type;

            } else {

                this._maps[ label ] = {
                    type,
                    node: current,
                };

            }

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

        return super.findRadix(label);

    }

    async findRadixLeaf(label) {

        label = this.processLeafLabel(label);

        const element = this._maps[label];
        if (element){

            if (element.type === "deleted") return undefined;
            else if (element.type === "saved" || element.type === "view") return element.node;

        }

        return super.findRadixLeaf(label);
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

        const labelComplete = parent.labelCompleteFast()+label;

        const element = this._maps[labelComplete];
        if (element){

            if (element.type === "deleted") return undefined;
            else if (element.type === "saved" || element.type === "view") return element.node;

        }

        const child = await super.loadNodeChild(label, position, parent);

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
        return super.clearTree();

    }

    resetTree(){
        this._maps = {};
        return super.resetTree();
    }

    async saveTree(){
        await this.saveVirtualRadix();
    }

}