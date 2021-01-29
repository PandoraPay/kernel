const DBModel  = require( "../../db/db-generic/db-model")
const Exception  = require("../../helpers/exception");

const {SchemaBuiltMerkleTree} = require('./schema/schema-build-merkle-tree')

module.exports = class MerkleTree extends DBModel {
    
    constructor(scope, schema = SchemaBuiltMerkleTree,  data, type, creationOptions){
        
        super(scope, schema, data, type, creationOptions);

        this._leaves = undefined;
        this._leavesNonPruned = undefined;
        
    }

    _setCount(count){
        if (count === 0) this.levels = 0;
        else if (count === 1) this.levels = 1;
        else this.levels = Math.ceil ( Math.log2( count ) );

        this.root = this._createModelObject(undefined, undefined, "root");
        this._calculateLevelsCounts(count);

        if (this._countChanged) this._countChanged( count );

    }

    /**
     * counts per level used to calculate the height of a node by doing DFS creation
     */
    _calculateLevelsCounts(count = this.count){

        let level = this.levels, c = count, lengths = [ 1 ];
        do{
            lengths[level] = c ;
            c = c - Math.floor( c / 2 );
            level--;
        } while ( c > 1 );

        let counts = [0];

        for (let i=1; i < lengths.length; i++)
            counts[i] =  lengths[i-1] + counts[i-1];

        this.levelsCounts = counts;

    }

    fillMerkleTree( data,){

        if (!data) throw new Exception(this, "data is invalid");
        if (!Array.isArray(data)) throw new Exception(this, "data is not an Array");

        this.resetCount(data.length);

        /**
         * Create all levels
         */
        this.root.fillMerkleTreeNode(data,  0, this.levels );
        this._leaves = undefined;

    }

    resetCount(count = 0){
        this.count = count;
        this._setCount(count);
    }

    leaves(){
        if (this._leaves) return this._leaves;

        if (this.root.children.length === 0) return [];

        this._leaves = this.root.leaves( this.levels );
        return this._leaves;
    }

    leavesNonPruned(){
        if (this._leavesNonPruned) return this._leavesNonPruned;

        if (this.root.children.length === 0) return [];

        this._leavesNonPruned = this.root.leaves( this.levels );
        this._leavesNonPruned.filter( it => !it.pruned );

        return this._leavesNonPruned;
    }

    get totalNodes(){

        let size =0 , c = this.count;
        while (c > 1){
            size += c ;
            c = Math.round( c /2 );
        }
        size +=  c;
        return size;
    }

    get BFS(){
        return this.root.BFS();
    }

    get DFS(){
        return this.root.DFS();
    }

    printLeafNodes(){
        const leaves = this.leaves();

        const text = leaves.map ( it => it.data.toString("hex") );

        console.log( text.join(" , ") );
    }

    unmarshal(input, type = "buffer", callbackObject, unmarshalOptions = {}) {

        const out = super.unmarshal(input, type, callbackObject, unmarshalOptions);

        this._calculateLevelsCounts();

        return out;
    }


    _pruningLeaves(prunedLeaves, removeParents, prunedHeightsMap = {}){

        if (!prunedLeaves || !Array.isArray(prunedLeaves)) return;
        const prunedLeavesMap = {};
        prunedLeaves.map( it => prunedLeavesMap[it] = true );

        const height = this.levelsCounts[this.levelsCounts.length-2];
        for (let i=0; i < this.count; i ++) {

            if (prunedLeavesMap[i])
                prunedHeightsMap[i + height] = true;

            if (removeParents) {
                let node = (i + height);
                while ( node % 2 === 1 && prunedHeightsMap[node-1] && prunedHeightsMap[node] ){
                    const parent = Math.floor( node / 2 );
                    prunedHeightsMap[ parent ] = true;
                    node = parent;
                }
            }

        }

        return prunedHeightsMap;
    }

    _pruningHeight (prunedHeights){

        if (!prunedHeights ) return;
        if (Array.isArray(prunedHeights)){

            const prunedHeightsMap = {};
            prunedHeights.map( it => prunedHeightsMap[it] = true );
            prunedHeights = prunedHeightsMap;

        }

        return prunedHeights;

    }

    createUnmarshalPruningLeavesCallback( prunedLeaves, removeParents, callbackObject){

        const prunedHeightsMap = this._pruningLeaves(prunedLeaves, removeParents);
        return this.createUnmarshalHeightsCallback(prunedHeightsMap, callbackObject);

    }

    createUnmarshalHeightsCallback(prunedHeights, callbackObject ){

        prunedHeights = this._pruningHeight(prunedHeights);

        if (!callbackObject)
            callbackObject = (obj, unmarshalOptions, data, type) => obj.unmarshal( data, type, undefined, unmarshalOptions );

        const newCallback = function ( obj, unmarshalOptions, data, type ) {

            if (prunedHeights[obj.height])
                obj.pruned = true;

            callbackObject( obj, unmarshalOptions, data, type);

            return obj;

        };

        return newCallback;

    }

    createUnmarshalOptionsHeights(prunedHeights, unmarshalOptions = {} ){

        prunedHeights = this._pruningHeight(prunedHeights);

        unmarshalOptions.isFieldSkipped = function ( field, schema ) {

            if (!prunedHeights[this.height]) return true;

            if (field === "pruned" ) {
                this.pruned = true;
                return false;
            }

            if (field === "children") return false;

            return true;

        };

        return unmarshalOptions;
    }


    createMarshalPruningLeavesCallback(prunedLeaves, removeParents, callbackObject){

        const prunedHeightsMap = this._pruningLeaves(prunedLeaves, removeParents);
        return this.createMarshalPruningHeightsCallback(prunedHeightsMap, callbackObject);

    }

    createMarshalPruningHeightsCallback(prunedHeights, callbackObject){

        prunedHeights = this._pruningHeight(prunedHeights);

        if (!callbackObject)
            callbackObject = (obj, marshalOptions, type, text) => obj._marshal(type, text, undefined, marshalOptions );

        const newCallback = function ( obj, marshalOptions, type, text ) {

            const prevPruned = obj.pruned;
            if (prunedHeights[obj.height] && !prevPruned){
                const hash = obj.hash();
                obj.pruned = true;
                obj.prunedHash = hash;
            }

            const out = callbackObject( obj, marshalOptions, type, text);

            obj.pruned = prevPruned;

            return out;

        };

        return newCallback;

    }

    /**
     * It will load only the leaves
     */
    loadPrunningExceptLeaves(leaves, removeParents, id, infix, table, db, type, input, multi, unmarshalOptions = {}, callbackObject){

        if (!Array.isArray(leaves)) leaves = [leaves];

        const leavesObject = {};
        leaves.map( it => leavesObject[it] = true );

        const prunedHeightsMap = {};
        this._countChanged = ( count ) => {

            const prunedLeaves = [];
            for (let i=0; i < count; i++)
                if ( !leavesObject[i] ) prunedLeaves.push(i);

            this._pruningLeaves(prunedLeaves, removeParents, prunedHeightsMap)
        };

        unmarshalOptions = this.createUnmarshalOptionsHeights( prunedHeightsMap, unmarshalOptions);
        return this.load( id, infix, table, db, type, input, multi, unmarshalOptions, callbackObject );

    }

    /**
     * It will load all the nodes of merkle tree except the specified leaves which will be considered pruned.
     * If the removeParents is set true, the parents of the tree will be removed as well.
     */
    loadPruningLeaves( prunedLeaves, removeParents, id, infix, table, db, type, input, multi, unmarshalOptions = {}, callbackObject ){

        const prunedHeightsMap = {};
        this._countChanged = ( count ) => {
            this._pruningLeaves(prunedLeaves, removeParents, prunedHeightsMap)
        };

        unmarshalOptions = this.createUnmarshalOptionsHeights( prunedHeightsMap, unmarshalOptions);
        return this.load( id, infix, table, db, type, input, multi, unmarshalOptions, callbackObject );

    }

    /**
     * It will load all the nodes of the merkle tree except the specified heights which will be considered pruned.
     * If the removeParents is set true, the parents of the tree will be removed as well.
     */
    loadPruningHeights( prunedHeights, id, infix, table, db, type, input, multi, unmarshalOptions = {}, callbackObject ){

        unmarshalOptions = this.createUnmarshalOptionsHeights( prunedHeights, unmarshalOptions);
        return this.load( id, infix, table, db, type, input, multi, unmarshalOptions, callbackObject );

    }

    validateMerkleTree(){

        const leaves = this.leaves();

        //Verify number of leaves
        if ( leaves.length !== this.count)
            throw new Exception(this, "Number of leaves is incorrect");

        // TODO verify heights
        // const count = Math.pow(2, this.levels) - ( Math.pow(2, this.levels-1) - Math.round( this.count / 2 ) );
        //
        // for (let i=0; i < leaves.length; i++)
        //     if (leaves[i].height !== count + i)
        //         throw new Exception(this, "error")

        return true;

    }

}

