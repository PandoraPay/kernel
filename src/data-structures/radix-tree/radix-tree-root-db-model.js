const Helper = require( "../../helpers/helper");
const RadixTreeNodeDBModel = require("./radix-tree-node-db-model")
const {RadixTreeRootDBSchemaBuilt} = require('./schema/radix-tree-root-db-schema-build')

module.exports = class RadixTreeRootDBModel extends RadixTreeNodeDBModel {

    constructor(scope, schema = RadixTreeRootDBSchemaBuilt,  data, type, creationOptions ){

        super(scope, schema, data, type, creationOptions);
        this.rootLoaded = false;

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


