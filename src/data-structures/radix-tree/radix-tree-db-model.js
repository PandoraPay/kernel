const Exception = require("../../helpers/exception");
const Helper = require( "../../helpers/helper");
const Model = require( "../../marshal/model");

const DBModel = require("../../db/db-generic/db-model");
const RadixTreeRootDBModel = require( "./radix-tree-root-db-model")
const RadixTreeNodeTypeEnum = require( "./radix-tree-node-type-enum" );
const RadixTreeNodeDBModel = require( "./radix-tree-node-db-model");
const {RadixTreeDBSchemaBuilt} = require('./schema/radix-tree-db-schema-build')

module.exports = class RadixTree extends DBModel {

    constructor(scope, schema = RadixTreeDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    init(data){
        this.tree = this;
    }

    async saveTree(){
        return this.root.save();
    }

    async clearTree(){
        
        const out = await this.loadTree();

        if (out.length > 0) {
            await this.root.delete();
            this.createNewRoot();
        }

        return out;

    }

    createNewRoot(){

        const newRoot = this._createModelObject( {
            id: this.root.id,
        },"object","root", undefined,  undefined, undefined, {skipValidation: true, skipProcessingConstructionValues: true} );

        this.root = newRoot;

        return newRoot;
    }
    
    loadTree(){
        return this.root.DFS(true);
    }

    /**
     * Used later on for virtualizing node deletion
     * @param node
     * @returns {*}
     * @private
     */
    _deleteNode(node){
        return node.delete();
    }

    /**
     * Used later on for virtualizing node saving
     * @param node
     * @returns {Promise<*|*|*>|Promise<*|*|undefined>|Promise<*>|void|*}
     * @private
     */
    _saveNode(node){
        return node.save();
    }

    /**
     * Starting from the leaves, it will propagate the new hashes up
     * @param save
     * @returns {Promise<void>}
     */
    async optimizedHashPropagation(leaves){

        if (!leaves) leaves = await this.root.leaves(false);

        const queue = [];

        //filling the ids
        const queueObject = {};
        for (let i=0; i < leaves.length; i++) {

            if (leaves[i].isChanged()) {
                queue.push(leaves[i]);
                queueObject[leaves[i].labelCompleteFast()] = true;
            }

        }

        for (let i=0; i < queue.length; i++){

            const child = queue[i];
            const parent = child.parent;
            if ( parent.__data.childrenHashes && parent.__data.childrenHashes[child.parentIndex] && !parent.__data.childrenHashes[child.parentIndex].buffer.equals( child.hash() ) ){

                parent.__data.childrenHashes[child.parentIndex].buffer = child.hash();
                parent.__changes["childrenHashes"] = true;

                const parentLabelComplete = parent.labelCompleteFast();
                if (!queueObject[ parentLabelComplete ]){
                    queue.push(parent);
                    queueObject[ parentLabelComplete ] = true;
                }

            }


        }

    }

    async addRadix( label, data, returnErrorIfFound, save = true){

        label = this.processLeafLabel(label);

        //if found was not specified, let's find it
        const found = await this.findRadix( label);

        //construct the data as an object
        if ( this.root.childNodeDataModelClass && !(data instanceof Model) )
            data = this.root._createSimpleModelObject( this.root.childNodeDataModelClass, this.root.childNodeDataSchemaBuilt, "children", data );

        //found node already
        if (found.result) {

            if (returnErrorIfFound)
                throw new Exception(this, "Radix Element already found");

            //update
            found.node.data = data;

            if (data instanceof Model) data.parent = found.node;

            await found.node.propagateHashChange();
            await this._saveNode(found.node);

            return found.node;
        }

        let node = found.node;

        const toSaves = [];

        if (found.match > 0  ){

            const common = node.__data.label.substr(0, found.match );

            //update label
            const remainingLabel = node.__data.label.substr( found.match );

            const nodePrevLabel = node.__data.label;
            const nodeData = node.__data.data;
            const nodeType = node.__data.type;
            const nodeChildrenCount = node.__data.childrenCount;
            const nodeChildrenLabels = node.__data.childrenLabels;
            const nodeChildrenHashes = node.__data.childrenHashes;

            //will be common node
            node.label = common;
            node.id = node.getNewId();

            node.type = RadixTreeNodeTypeEnum.RADIX_TREE_NODE;

            node.data = node.childNodeDataEmpty;

            node.__data.childrenCount = 0;
            node.__data.childrenLabels = [];
            node.__data.childrenHashes = [];

            const newNode = node._createSimpleModelObject( node.childNodeModelClass, node.childNodeSchemaBuilt, "children", {
                label: remainingLabel,
                data: nodeData,
                type: nodeType,
                childrenCount: nodeChildrenCount,
                childrenLabels: nodeChildrenLabels,
                childrenHashes: nodeChildrenHashes,
            }, "object", 0,  {skipProcessingConstructionValues: true, } );

            newNode.children = node.children;
            for (let i=0; i < newNode.children.length; i++)
                if (newNode.children[i]) {
                    newNode.children[i].parent = newNode;
                    newNode.children[i].parentIndex = i;
                }

            node.children = [];

            node.addChild(remainingLabel, newNode, true);

            //update parent to common
            node.parent.childrenLabels[ node.parentIndex ].string = common;
            node.parent.__changes["childrenLabels"] = true;

            toSaves.push(node, newNode );
        } else {
            node.type = RadixTreeNodeTypeEnum.RADIX_TREE_NODE;
            toSaves.push(node);
        }

        const newLabel = label.substr( found.labelOffset );

        const child  = node._createSimpleModelObject( node.childNodeModelClass, node.childNodeSchemaBuilt,  "children",{
            label: newLabel,
            data: data,
            type: RadixTreeNodeTypeEnum.RADIX_TREE_LEAF,
        }, "object", 0,  {skipProcessingConstructionValues: true} );

        if (data instanceof Model) data.parent = child;

        node.addChild(newLabel, child);

        toSaves.push( child );

        //calculate new hash
        if (save){

            await child.propagateHashChange();

            for (const node of toSaves)
                await this._saveNode(node);

        }

        this.root.rootLoaded = true;

        return child;
    }

    async deleteRadix( label, save = true){

        label = this.processLeafLabel(label);

        const find = await this.findRadix( label );

        //nothing found7
        if (!find.result)
            return undefined;

        let node = find.node;
        let toSave, grandParent;

        const toDelete = node;
        let toDeleteParent;

        if (!(node.parent instanceof RadixTreeRootDBModel) && node.parent.__data.childrenCount === 2){

            toDeleteParent = node.parent;
            grandParent = node.parent.parent;

            const childIndex = toDelete.parentIndex;
            const otherChildIndex = childIndex === 0 ? 1 : 0;

            const otherChild = await toDeleteParent.loadChild( toDeleteParent.__data.childrenLabels[ otherChildIndex ].string, otherChildIndex );

            const newParent = grandParent._createSimpleModelObject( this.root.childNodeModelClass, this.root.childNodeSchemaBuilt, "children", {
                label: toDeleteParent.__data.label + otherChild.__data.label,
            }, "object", 0, {skipValidation: true, skipProcessingConstructionValues: true} );


            //id & type will be refresh automatically
            newParent.type = otherChild.__data.type;
            newParent.childrenCount = otherChild.__data.childrenCount;
            newParent.data = otherChild.__data.data;
            newParent.childrenLabels = otherChild.__data.childrenLabels;
            newParent.childrenHashes = otherChild.__data.childrenHashes;
            newParent.children = otherChild.children;

            //update parent & index
            for (let i=0; i < newParent.__data.childrenCount; i++){

                newParent.__data.childrenLabels[i].parent = newParent;

                newParent.__data.childrenHashes[i].parent = newParent;

                if (newParent.children[i])
                    newParent.children[i].parent = newParent;

            }

            const oldLabel = grandParent.__data.childrenLabels[ toDeleteParent.parentIndex ].string;
            grandParent.replaceChild( toDeleteParent, oldLabel + otherChild.__data.label, newParent );
            grandParent.__changes["childrenLabels"] = true;

            toDeleteParent.children = []; //make sure it will not delete its children
            toDeleteParent.__data.childrenCount = 0; //make sure it will not delete its children
            toDeleteParent.__data.childrenLabels = []; //make sure it will not delete its children
            toDeleteParent.__data.childrenHashes = []; //make sure it will not delete its children

            toSave = newParent;

            //toDeleteParent had 2 children, but now it will have 0

        } else {
            node.parent.removeChild(node);
            toSave = node.parent;

        }


        if (save){

            await this._deleteNode(toDelete);
            if (toDeleteParent) await this._deleteNode(toDeleteParent);

            await toSave.propagateHashChange();
            await this._saveNode(toSave);

        }

        return node

    }

    async findRadixLeaf( label){

        label = this.processLeafLabel(label);

        try{

            const obj = this.root._createSimpleModelObject( this.root.childNodeModelClass, this.root.childNodeSchemaBuilt, "children", {
                label: label,
                type: RadixTreeNodeTypeEnum.RADIX_TREE_LEAF,
            }, "object", 0,  { skipProcessingConstructionValues: true, skipValidation: true,} );

            await obj.load( this.root.id + label );

            return obj;

        }catch(err){
        }

    }

    async _loadRoot(){
        if ( !this.root.rootLoaded )
        try{
            await this.root.load(  );
        } catch (err) {

        }
    }

    async findRadix( label, prevFind ){

        label = this.processLeafLabel(label);

        let queue = [], labelOffset = 0;

        if (prevFind){

            queue = [prevFind.node];
            labelOffset = prevFind.labelOffset - prevFind.match;

        } else {

            await this._loadRoot();

            queue = [this.root];

        }

        let i=0, match = 0;
        while ( i < queue.length && labelOffset !== label.length){

            const node = queue[i++];
            match = 0;

            let foundChild;
            for (let i=0; i < node.__data.childrenCount; i++){

                const childLabel = node.__data.childrenLabels[i].string;

                while ( childLabel[match] === label[labelOffset] && labelOffset < label.length && match < childLabel.length  ){
                    match++;
                    labelOffset++;
                }

                if (match > 0 ){
                    
                    //loading specific children

                    const child = await node.loadChild( childLabel, i );

                    queue.push( child );
                    foundChild = child;
                    break;

                } else if (childLabel[0] > label[labelOffset]) break;

            }

            //found the final edge
            if (foundChild && match !== foundChild.__data.label.length )
                break;


        }

        return {
            result: labelOffset === label.length,
            node: queue[queue.length-1],
            labelOffset: labelOffset,
            match: match,
        };

    }

    async getRadix(label){

        const out = await this.findRadix(label);
        if (!out.result) return;

        return out.node;
    }

    async loadNodeChild(label, position, parent){

        const child = parent._createSimpleModelObject( parent.childNodeModelClass, parent.childNodeSchemaBuilt, "children", {
            label: label,
        }, "object", position, {skipProcessingConstructionValues: true, skipValidation: true } );

        await child.load( parent.id + label );
        return child;
    }

    processLeafLabel(label){

        if (label instanceof RadixTreeNodeDBModel) return label.labelCompleteFast();
        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length === 0) throw new Exception(this, "label length is invalid");

        if (label.length !== 40) throw "label is not leaf";

        return label;
    }

    labelCompleteFast(){
        return '';
    }

    resetTree(){
        return this.createNewRoot();
    }

}