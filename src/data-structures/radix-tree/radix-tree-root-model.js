const RadixTreeNodeModel = require("./radix-tree-node-model")
const {RadixTreeRootSchemaBuilt} = require('./schema/radix-tree-root-schema-build')
const RadixTreeNodeTypeEnum = require('./radix-tree-node-type-enum')

RadixTreeRootSchemaBuilt.childrenModelClass = RadixTreeNodeModel;

module.exports = class RadixTreeRootModel extends RadixTreeNodeModel {

    constructor(scope, schema = RadixTreeRootSchemaBuilt,  data, type, creationOptions ){

        super(scope, schema, data, type, creationOptions);
        this.rootLoaded = false;

    }

    getType(){
        return this.label.length === 40  ? RadixTreeNodeTypeEnum.RADIX_TREE_LEAF : RadixTreeNodeTypeEnum.RADIX_TREE_NODE;
    }

    getNewId(){
        return this._scope.parent.id + ":root";
    }

    onLoaded(){
        this.rootLoaded = true;
    }

    init(){
        this.tree = this._scope.parent;
    }

    async leaves(loadChildren = true){
        if (await this._checkRootLoaded() === false )
            return [];

        return super.leaves.call(this, loadChildren);
    }

    async BFS(loadChildren = true){
        if (await this._checkRootLoaded() === false )
            return [];

        return super.BFS.call(this, loadChildren);
    }

    async DFS(loadChildren = true){

        if (await this._checkRootLoaded() === false )
            return [];

        return super.DFS.call(this, loadChildren);

    }


    async _checkRootLoaded(){
        if (!this.rootLoaded)
            try{
                await this.load();
                this.rootLoaded = true;
                return true;
            }catch(err){

            }

    }

}


