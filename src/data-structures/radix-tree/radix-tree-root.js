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

        this.nodeClass = RadixTreeNode;

        this.rootLoaded = false;

    }

    onLoaded(){
        this.rootLoaded = true;
    }

    init(){
        this.tree = this._scope.parent;
    }

    async DFS(loadChildren){

        if (!this.rootLoaded)
            try{
                await this.load();
                this.rootLoaded = true;
            }catch(err){
                return [];
            }

        return super.DFS.call(this, loadChildren);

    }

}


