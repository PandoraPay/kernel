import Helper from "src/helpers/helper"
import DBSchema from "src/db/db-generic/db-schema"
import Exception from "src/helpers/exception"

import RadixTreeNodeTypeEnum from "./radix-tree-node-type-enum"

import DBSchemaBuffer from "src/db/db-generic/samples/db-schema-buffer";
import DBSchemaString from "src/db/db-generic/samples/db-schema-string";
import CryptoHelper from "src/helpers/crypto/crypto-helper";

export default class RadixTreeNode extends DBSchema {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "node",
                    fixedBytes: 4,
                },

                /**
                 * Required to retrieve its parents
                 */

                label: {

                    type: "string",
                    minSize: 1,
                    maxSize: 40,

                    default(){
                        return this._scope.parent.childrenLabels[this._scope.parentIndex];
                    },

                    setEvent(label){

                        if (this.type !== undefined) this.type = this.getType();
                        if (this.id) this.id = this.getNewId();

                    },

                    skipHashing: true,
                    skipMarshal: true,

                    position: 101,
                },

                id:{

                    minSize: 4,
                    maxSize: 80,

                    default(){
                        return this.getNewId();
                    },

                    unique: true,

                    position: 102,

                },

                type: {
                    type: "number",
                    default(){
                        return this.getType();
                    },

                    position: 103,
                },

                pruned: {
                    type: "boolean",

                    default: false,

                    skipHashing: true,
                    skipMarshal: true,

                    position: 104,

                },

                data: {

                    type: "buffer",
                    minSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.pruned ? 1 : 0;
                    },

                    maxSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.pruned ? 262143 : 0;
                    },

                    skipHashing(){ return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.pruned ); },
                    skipSaving() { return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.pruned ); },
                    skipMarshal(){ return (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE || this.pruned ); },

                    position: 105,
                },

                childrenCount:{

                    type: "number",

                    minSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.pruned ? 1 : 0;
                    },

                    maxSize(){
                        return this.type === RadixTreeNodeTypeEnum.RADIX_TREE_NODE && !this.pruned ? 16 : 0;
                    },

                    position: 106,

                },


                childrenLabels: {

                    type: "array",
                    classObject: DBSchemaString,

                    fixedBytes(){ return this.childrenCount },

                    skipHashing(){ return this.pruned },
                    skipSaving(){ return this.pruned },
                    skipMarshal(){ return this.pruned },

                    position: 107,

                },

                childrenHashes:{

                    type: "array",
                    classObject: DBSchemaBuffer,

                    fixedBytes(){ return this.childrenCount; },

                    skipHashing(){ return this.pruned },
                    skipSaving(){ return this.pruned },
                    skipMarshal(){ return this.pruned },

                    position: 108,
                },


                prunedHash: {

                    type: "buffer",
                    fixedBytes: 32,

                    skipHashing(){ return !this.pruned; },
                    skipMarshal(){ return !this.pruned; },

                    getter(){
                        return this.pruned ? this.__data.prunedHash : this.hash();
                    },

                    position: 109,
                },



            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    returnSpecificHash(){
                        return this.pruned ? this.__data.prunedHash : undefined ;
                    },

                    fct: CryptoHelper.sha256

                },

            },

            saving: {

                saveInfixParentTable: false,
                indexableById: false,
                /**
                 * scan is not supported because of disabling indexable by id
                 */
            }

        }, schema, false), data, type, creationOptions);

        this.children = [];

        this.nodeClass = RadixTreeNode;
        this.nodeClassDataEmpty = Buffer.alloc(0);
        
    }

    init(data){
        this.tree = this._scope.parent.tree;
    }

    getNewId(){
        return this._scope.parent.id + this.label;
    }

    getType(){
        return this._scope.parent.id.length - this.tree.root.id.length + this.label.length === 40  ? RadixTreeNodeTypeEnum.RADIX_TREE_LEAF : RadixTreeNodeTypeEnum.RADIX_TREE_NODE;
    }

    //insert it lexicographically by keeping it sorted
    addChild(label, child){

        let i = 0;
        while ( i < this.childrenLabels.length && label >= this.childrenLabels[i].string )
            i++;

        this.childrenCount = this.childrenLabels.length + 1;

        this.pushArray("childrenLabels", { string: label }, "object", undefined, i);
        this.pushArray("childrenHashes", { buffer: child.hash() }, "object", undefined, i);

        if (!this.children[i]) this.children[i] = child;
        else this.children.splice( i, 0, child );

        child.parent = this;

        for (let j = Math.max(i-1, 0); j < this.__data.childrenCount; j++) {

            this.__data.childrenLabels[j].parentIndex = j;
            this.__data.childrenHashes[j].parentIndex = j;
            if (this.children[j]) this.children[j].parentIndex = j;
        }
        
    }

    removeChild(child){

        const i = child.parentIndex;

        this.childrenCount = this.childrenLabels.length - 1;

        const newLabels = this.childrenLabels.slice();
        newLabels.splice(i, 1);
        this.childrenLabels = newLabels;

        const newHashes = this.childrenHashes.slice();
        newHashes.splice(i, 1);
        this.childrenHashes = newHashes;

        this.children.splice(i, 1);

        //update index
        for (let j = Math.max(i-1, 0); j < this.__data.childrenCount; j++) {

            this.__data.childrenLabels[j].parentIndex = j;
            this.__data.childrenHashes[j].parentIndex = j;
            if (this.children[j]) this.children[j].parentIndex = j;
        }


        return true;

    }

     replaceChild(removeChild, newLabel, newChild){

        //remove
        const i = removeChild.parentIndex;

        const newLabels = this.childrenLabels.slice();
        newLabels.splice(i, 1);

        const newHashes = this.childrenHashes.slice();
        newHashes.splice(i, 1);

        const newChildren = this.children.slice();
        newChildren.splice(i, 1);

        //add

        let i2 = 0;
        while ( i2 < newLabels.length && newLabel >= newLabels[i2].string )
            i2++;

        const newLabelObject = this._createSchemaObject( { string: newLabel }, "object", "childrenLabels", undefined,  undefined, i2 );
        const newHashObject = this._createSchemaObject( { buffer: newChild.hash() }, "object", "childrenHashes", undefined,  undefined, i2 );

        newLabels.splice(i2, 0, newLabelObject );
        newHashes.splice(i2, 0, newHashObject );
        newChildren.splice(i2, 0, newChild );

        this.childrenLabels = newLabels;
        this.childrenHashes = newHashes;
        this.children = newChildren;

        //update index
        for (let j = Math.max(0, Math.min( i-1, i2-1 )); j < this.__data.childrenCount; j++) {

            this.__data.childrenLabels[j].parentIndex = j;
            this.__data.childrenHashes[j].parentIndex = j;
            if (this.children[j]) this.children[j].parentIndex = j;
        }

    }

    findChild(child){

        for (let i=0; i < this.childrenLabels.length; i++)
            if (this.childrenLabels[i].string === child.label)
                return i;

        return -1;
    }

    async loadChild(label, position){

        if (position === undefined)
            for (let i=0; i < this.childrenLabels.length; i++)
                if (this.childrenLabels[i].string === label){
                    position = i;
                    break;
                }

        if ( position === undefined) throw new Exception(this, "Child not found", label);

        if (this.children[position])
            return this.children[position];

        const child = await this.tree.loadNodeChild(label, position, this );

        this.children[position] = child;

        return child;
    }

    async loadChildren() {

        const promises = [];
        for (let i = 0; i < this.childrenLabels.length; i++)
            if (!this.children[i])
                promises.push(this.loadChild(this.childrenLabels[i].string, i));

        return Promise.all(promises);

    }

    labelComplete( label = this.label ){

        let node = this;
        const array = [];

        while (node !== this.tree){

            if (  node !== this || ( node === this && !label )  )
                array.unshift( node.label );
            else
                array.unshift( label );

            node = node.parent;
        }

        return array.join('');

    }

    labelCompleteFast(){
        return this.id.substr(  this.tree.root.id.length );
    }

    /**
     * Caution, it will load the entire tree
     * @returns {Promise<Array|T[]|RadixTreeNode[]>}
     */
    async leaves(loadChildren = true){

        if (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF) return [this];

        if (loadChildren)
            await this.loadChildren();

        const promises = [];
        for (const child of this.children)
            promises.push( child.leaves(loadChildren) );
        const out = await Promise.all(promises);

        let leaves = [];
        for (const child of out )
            leaves =  leaves.concat( child );

        return leaves;

    }

    /**
     * Caution, it will load the entire tree
     * @returns {Promise<Array|T[]|RadixTreeNode[]>}
     */
    async DFS(loadChildren){

        if (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF) return [this];

        if (loadChildren)
            await this.loadChildren();

        const promises = [];
        for (const child of this.children)
            promises.push ( child.DFS(loadChildren) );
        const out = await Promise.all(promises);

        let dfs = [];
        for (const child of out)
            dfs = dfs.concat( child );

        dfs.push(this);

        return dfs;
    }

    /**
     * Caution, it will load the entire tree
     * @returns {Promise<Array|T[]|RadixTreeNode[]>}
     */
    async BFS(loadChildren){

        if (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF) return [this];

        let bfs = [this];
        if (loadChildren)
            await this.loadChildren();

        const promises = [];
        for (const child of this.children)
            promises.push( child.BFS(loadChildren) );
        const out = await Promise.all(promises);

        for (const child of out)
            bfs = bfs.concat( child );

        return bfs;

    }

    savingAdditional(){

        const array = [];
        for (let child in this.children)
            if (this.children[child])
                array.push(this.children[child]);

        return array;

    }

    getDelete(){

        if (this.parent instanceof RadixTreeNode && this.parent.__data.childrenCount === 2)  return this.parent;
        return this;

    }

    getDeleteUpdate(){

        if (this.parent instanceof RadixTreeNode && this.parent.__data.childrenCount === 2) return this.parent.parent;
        return this.parent;

    }

    async propagateHashChange(){

        let node = this;
        while ( node.parent.childrenHashes  ){
            node.parent.childrenHashes[node.parentIndex].buffer = node.hash();
            node.parent.__changes["childrenHashes"] = true;
            node = node.parent;
        }

        return this.tree._saveNode(node);
    }

}


