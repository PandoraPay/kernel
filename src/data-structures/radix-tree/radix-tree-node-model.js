const Helper = require( "../../helpers/helper");
const DBModel = require("../../db/db-generic/db-model")
const Exception = require("../../helpers/exception");
const RadixTreeNodeTypeEnum = require( "./radix-tree-node-type-enum" )
const {RadixTreeNodeSchemaBuilt} = require('./schema/radix-tree-node-schema-build')

class RadixTreeNodeModel extends DBModel {

    constructor(scope, schema = RadixTreeNodeSchemaBuilt,  data, type, creationOptions){
        super(scope, schema, data, type, creationOptions);
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
    addChild(label, data ){

        let i = 0;
        while ( i < this.__data.childrenLabels.length && label >= this.__data.childrenLabels[i].string )
            i++;

        this.childrenCount = this.__data.childrenCount + 1;

        this.pushArray("childrenLabels", { string: label }, "object", undefined, i);
        const child = this.pushArray("children", data, "object", undefined, i);
        this.pushArray("childrenHashes", { buffer: child.hash() }, "object", undefined, i);

        return child;
    }

    removeChild(child){

        const i = child.parentIndex;

        this.childrenCount = this.__data.childrenCount - 1;

        this.removeArray("childrenLabels", i);
        this.removeArray("childrenHashes", i);
        this.removeArray("children", i);

        child.parent = null;

        return true;
    }

     replaceChild(removeChild, newLabel, newChildData ){

        //remove
        const i = removeChild.parentIndex;

        const newLabels = this.__data.childrenLabels.slice();
        newLabels.splice(i, 1);

        const newHashes = this.__data.childrenHashes.slice();
        newHashes.splice(i, 1);

        const newChildren = this.__data.children.slice();
        newChildren.splice(i, 1);

        //add

        let i2 = 0;
        while ( i2 < newLabels.length && newLabel >= newLabels[i2].string )
            i2++;

        const newLabelObject = this._createModelObject( { string: newLabel }, "object", "childrenLabels", undefined,  undefined, i2 );
        newLabels.splice(i2, 0, newLabelObject );
        this.childrenLabels = newLabels;

        const newChild = this._createModelObject( newChildData, "object", "children", undefined,  undefined, i2 );
        newChildren.splice(i2, 0, newChild );
        this.children = newChildren;

        const newHashObject = this._createModelObject( { buffer: newChild.hash() }, "object", "childrenHashes", undefined,  undefined, i2 );
        newHashes.splice(i2, 0, newHashObject );
        this.childrenHashes = newHashes;

        //update index
        for (let j = Math.max(0, Math.min( i-1, i2-1 )); j < this.__data.childrenCount; j++) {
            this.__data.childrenLabels[j].parentIndex = j;
            this.__data.childrenHashes[j].parentIndex = j;
            if (this.__data.children[j]) this.__data.children[j].parentIndex = j;
        }

        return newChild;
    }

    findChild(child){

        for (let i=0; i < this.__data.childrenLabels.length; i++)
            if (this.__data.childrenLabels[i].string === child.label)
                return i;

        return -1;
    }

    async loadChild(label, position){

        if (position === undefined)
            for (let i=0; i < this.__data.childrenLabels.length; i++)
                if (this.__data.childrenLabels[i].string === label){
                    position = i;
                    break;
                }

        if ( position === undefined) throw new Exception(this, "Child not found", label);

        if (this.__data.children[position])
            return this.__data.children[position];

        const child = await this.tree.loadNodeChild(label, position, this );

        if (!child)
            throw new Exception(this, "Child was not loaded");

        this.__data.children[position] = child;
        child.parentIndex = position;

        return child;
    }

    async loadChildren() {

        const promises = [];
        for (let i = 0; i < this.__data.childrenCount; i++)
            if (!this.__data.children[i])
                promises.push(this.loadChild(this.__data.childrenLabels[i].string, i));

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
     * @returns {Promise<Array|T[]|RadixTreeNodeModel[]>}
     */
    async leaves(loadChildren = true){

        if (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF) return [this];

        if (loadChildren)
            await this.loadChildren();

        const promises = [];
        for (const child of this.__data.children)
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
        for (const child of this.__data.children)
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
        for (const child of this.__data.children)
            promises.push( child.BFS(loadChildren) );
        const out = await Promise.all(promises);

        for (const child of out)
            bfs = bfs.concat( child );

        return bfs;

    }

    getDelete(){

        if (this.parent instanceof RadixTreeNodeModel && this.parent.__data.childrenCount === 2)  return this.parent;
        return this;

    }

    getDeleteUpdate(){

        if (this.parent instanceof RadixTreeNodeModel && this.parent.__data.childrenCount === 2) return this.parent.parent;
        return this.parent;

    }

}

RadixTreeNodeSchemaBuilt.fields.children.modelClass = RadixTreeNodeModel;

module.exports = RadixTreeNodeModel;