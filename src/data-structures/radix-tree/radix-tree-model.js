const Exception = require("../../helpers/exception");
const Helper = require( "../../helpers/helper");
const Model = require( "../../marshal/model");

const DBModel = require("../../db/db-generic/db-model");
const RadixTreeRootModel = require( "./radix-tree-root-model")
const RadixTreeNodeTypeEnum = require( "./radix-tree-node-type-enum" );
const {RadixTreeSchemaBuilt} = require('./schema/radix-tree-schema-build')

module.exports = class RadixTreeModel extends DBModel {

    constructor(scope, schema = RadixTreeSchemaBuilt, data, type, creationOptions) {
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

        const newRoot = this._createModelObject( {},"object","root" );
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

    async addRadix( label, data, returnErrorIfFound, save = true){

        label = this.processLeafLabel(label);

        //if found was not specified, let's find it
        const found = await this.findRadix( label);

        //found node already
        if (found.result) {

            if (returnErrorIfFound)
                throw new Exception(this, "Radix Element already found");

            //update
            found.node.data = data;
            if (data instanceof Model) data.parent = found.node;

            await this._saveNode(this.root);

            return found.node;
        }

        let node = found.node;

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
            const nodeChildren = node.children;

            //will be common node
            node.label = common;
            node.id = node.getNewId();

            node.type = RadixTreeNodeTypeEnum.RADIX_TREE_NODE;

            if (node._schema.fields.data.type === "buffer")
                node.data = Buffer.alloc(0);
            else
            if (node._schema.fields.data.type === "object")
                node.data = null;

            //__data can be used because addChild will update its changes
            node.__data.childrenCount = 0;
            node.__data.childrenLabels = [];
            node.__data.childrenHashes = [];
            node.children = [];

            const newNode = node.addChild(remainingLabel, {
                label: remainingLabel,
                data: nodeData,
                type: nodeType,
                childrenCount: nodeChildrenCount,
                childrenLabels: nodeChildrenLabels,
                childrenHashes: nodeChildrenHashes,
                children: nodeChildren,
            } );

            //update parent to common
            node.parent.childrenLabels[ node.parentIndex ].string = common;

        } else {
            node.type = RadixTreeNodeTypeEnum.RADIX_TREE_NODE;
        }

        const newLabel = label.substr( found.labelOffset );

        const child = node.addChild(newLabel, {
            label: newLabel,
            data: data,
            type: RadixTreeNodeTypeEnum.RADIX_TREE_LEAF,
            childrenCount: 0,
            children: [],
        });

        if (save)
            await this._saveNode( this.root );

        this.root.rootLoaded = true;

        return child;
    }

    async deleteRadix( label, save = true){

        label = this.processLeafLabel(label);

        const find = await this.findRadix( label );

        //nothing found
        if (!find.result)
            return;

        let node = find.node, toSave;

        if (!(node.parent instanceof RadixTreeRootModel) && node.parent.__data.childrenCount === 2){

            const toDeleteParent = node.parent;
            const grandParent = node.parent.parent;

            const childIndex = node.parentIndex;
            const otherChildIndex = childIndex === 0 ? 1 : 0;

            const otherChild = await toDeleteParent.loadChild( toDeleteParent.__data.childrenLabels[ otherChildIndex ].string, otherChildIndex );

            const oldLabel = grandParent.__data.childrenLabels[ toDeleteParent.parentIndex ].string;

            const newParent = grandParent.replaceChild( toDeleteParent, oldLabel + otherChild.__data.label, {
                childrenCount: otherChild.__data.childrenCount,
                data: otherChild.__data.data,
                childrenLabels: otherChild.__data.childrenLabels,
                childrenHashes: otherChild.__data.childrenHashes,
                children: otherChild.children,
            } );

            toDeleteParent.parent = undefined;
            toDeleteParent.children = []; //make sure it will not delete its children
            toDeleteParent.__data.childrenCount = 0; //make sure it will not delete its children
            toDeleteParent.__data.childrenLabels = []; //make sure it will not delete its children
            toDeleteParent.__data.childrenHashes = []; //make sure it will not delete its children

            //toDeleteParent had 2 children, but now it will have 0
            if (save)
                await this._deleteNode( toDeleteParent );

        } else {
            node.parent.removeChild(node);
        }


        if (save){
            await this._deleteNode( node );
            await this._saveNode( this.root );
        }

        return node

    }

    async findRadixLeaf( label){

        label = this.processLeafLabel(label);

        try{

            const obj = this.root._createSimpleModelObject(  this.root._schema.childrenModelClass, undefined, "children", {}, "object", undefined, {loading: true} );

            obj.label = label;

            await obj.load( this.root.id + label, undefined, undefined, undefined, undefined, undefined, undefined, {
                isFieldSkipped: (field) => field === "label",
            } );

            return obj;

        }catch(err){
        }

    }

    async _loadRoot(){
        if ( !this.root.rootLoaded )
            try{
                await this.root.load( );
            } catch (err) {

            }
    }

    async findRadix( label ){

        label = this.processLeafLabel(label);

        let labelOffset = 0;

        if (!this.root.rootLoaded)
            await this._loadRoot();

        const queue = [this.root];

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

    createEmptyChild(  parent, position){
        return parent._createSimpleModelObject( this.root._schema.childrenModelClass, undefined,  "children", {}, "object", position, {loading: true}, );
    }

    createDataChild( parent, data, position){

        const child = parent._createSimpleModelObject( this.root._schema.childrenModelClass, undefined,  "children", data, "object", position, );
        child.children = data.children;
        for (let i=0; i < child.children.length; i++)
            if (child.children[i])
                child.children[i].parent = child;

        return child;
    }

    async loadNodeChild(label, position, parent){

        const child = this.createEmptyChild( parent, position);

        await child.load( parent.id + label );

        return child;
    }

    processLeafLabel(label){

        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length !== 40) throw "label is not leaf";

        return label;
    }

    labelCompleteFast(){
        return '';
    }

    resetTree(){
        return this.createNewRoot();
    }

}