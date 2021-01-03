import Helper from "src/helpers/helper"
import DBSchema from "src/db/db-generic/db-schema"
import RadixTreeNode from "./radix-tree-node"
import RadixTreeNodeTypeEnum from "./radix-tree-node-type-enum";

export default class RadixTreeRoot extends RadixTreeNode {

    constructor(scope, schema,  data, type, creationOptions ){

        super(scope, Helper.merge({

            fields: {

                id:{
                    default(){
                        return this.parent.id+":root";
                    },
                },

                label: {
                    minSize: 0,
                    maxSize: 0,
                    default(){
                        return '';
                    }
                },

                type: {
                    default(){
                        return this.label.length === 40 ? RadixTreeNodeTypeEnum.RADIX_TREE_LEAF : RadixTreeNodeTypeEnum.RADIX_TREE_NODE;
                    },
                },

                childrenCount: {

                    minSize() {
                        return 0;
                    },

                },

                data: undefined,

            },

            saving: {
                saveInfixParentTable: true,
                saveInfixParentId: true,
            }

        }, schema, false), data, type, creationOptions);

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


