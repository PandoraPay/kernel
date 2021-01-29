const Helper = require( "../../helpers/helper");
const RadixTreeNode = require("./radix-tree-node")
const {SchemaBuiltRadixTreeRoot} = require('./schema/schema-build-radix-tree-root')

module.exports = class RadixTreeRoot extends RadixTreeNode {

    constructor(scope, schema = SchemaBuiltRadixTreeRoot,  data, type, creationOptions ){

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


