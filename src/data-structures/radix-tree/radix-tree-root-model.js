const RadixTreeNodeModel = require("./radix-tree-node-model")
const {RadixTreeRootSchemaBuilt} = require('./schema/radix-tree-root-schema-build')

RadixTreeRootSchemaBuilt.fields.children.modelClass = RadixTreeNodeModel;

module.exports = class RadixTreeRootModel extends RadixTreeNodeModel {

    constructor(scope, schema = RadixTreeRootSchemaBuilt,  data, type, creationOptions ){

        super(scope, schema, data, type, creationOptions);
        this.rootLoaded = false;

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


