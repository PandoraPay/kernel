const DBModel = require("../../db/db-generic/db-model")
const Model = require('../../marshal/model')
const Exception = require("../../helpers/exception");

const HashMapModel = require("./hash-map-model")
const ArrayHelper = require( "../../helpers/array-helper");

module.exports = class HashVirtualMapModel extends HashMapModel {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, schema, data, type, creationOptions);

        this._virtual = {};
        this._virtualList = [];

        this._fallback = undefined;

    }

    _getFallback(method){
        if (this._fallback) return this._fallback[method].bind(this._fallback);
        return super[method].bind(this);
    }

    resetHashMap(){
        this._virtual = {};
        this._virtualList = [];
    }

    clearHashMap( ){

        this.resetHashMap();
        return this._getFallback('clearHashMap')();

    }

    // it will load and stores all elements into the virtualMap
    async loadAllInVirtualMap(){
        try{

            const siblings = await this.findAllHashMap(  );

            for (let i=0; i < siblings.length; i++) {
                this._addCache(siblings[i].id, {
                    type: "view",
                    sortedListScore: 0,
                    element: siblings[i],
                });
            }
            return true;

        }catch(err){

        }
    }

    async addMap ( id, data, dataType ){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        const out = await this.getMap(id);

        if (out) throw new Exception(this, "Element already exists");

        let element = data;
        if (!(data instanceof DBModel))
            element = this._createHashElementChild(id, data, dataType);

        if (this._hasCache(id)) this._deleteCacheSortedList(id);
        this._virtual[id] = {
            type: "add",
            element,
        };

        return element;

    }

    async deleteMap( id ){

        if (!this._virtual[id])
            this._virtual[id] = { };

        if ( this._hasCache(id) ) this._deleteCacheSortedList(id);
        this._virtual[id].type = "del";

        return id;

    }

    async getMap ( id ){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        if (this._virtual[id]) {

            if (this._virtual[id].type === "del") return undefined;
            if (this._virtual[id].type === "add" ) return this._virtual[id].element;
            if (this._virtual[id].type === "view") return this._updateScoreCacheSortedList(id, 1).element; //updating importance


        }

        const out = await this._getFallback('getMap')(id);

        if (out) {

            const element = this._createHashElementChild( id, out.toObject(), "object"); //data is provided

            this._addCache(id, {
                id,
                type: "view",
                sortedListScore: 0,
                element,
            });

            return element;

        }

    }

    async existsMap(id){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");


            if (this._virtual[id]) {
                if (this._virtual[id].type === "del") return false;
                if (this._virtual[id].type === "add" || this._virtual[id].type === "view") return true;
            }

            return this._getFallback('existsMap')(id);

        }catch(err){

        }

        return false;
    }

    /**
     * Update will also create it if it doesn't exist
     * @param id
     * @param data
     * @returns {Promise<*>}
     */
    async updateMap (id, data, dataType){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        let element = data;
        if (!(data instanceof DBModel))
            element = this._createHashElementChild( id, data, dataType); //data is provided

        if ( this._hasCache(id) ) this._deleteCacheSortedList(id);

        this._virtual[id] = {
            id,
            type: "add",
            element,
        };

        return element;

    }

    async saveVirtualMap(resetVirtualMap = true){

        const promises = [];

        for (const id in this._virtual){

            const {type, element} = this._virtual[id];

            if (type === "add")
                promises.push( element.save() );
            else if (type === "del")
                promises.push( element ? element.delete() : this._getFallback('deleteMap')(id) );
            else if (type === "view") continue;


        }

        await Promise.all(promises);

        if (resetVirtualMap)
            this.resetHashMap();
        else {

            for (const id in this._virtual){

                const {type} = this._virtual[id];

                if (type === "del") delete this._virtual[id];
                else if (type === "add") {
                    this._virtual[id].type = "view";
                    this._addCache(id);
                }
                else if (type === "view") continue;
            }

        }

    }

    _hasCache(id){
        return this._virtual[id] && this._virtual[id].type === "view";
    }

    _deleteCache(id){
        const element = this._virtual[id];
        ArrayHelper.removeSortedArray( element, this._virtualList, (a,b) => a.sortedListScore - b.sortedListScore );
        delete this._virtual[id];
    }

    _addCache(id, element){
        this._virtual[id] = element;
        this._addCacheSortedList(id);
        return element;
    }

    _updateScoreCacheSortedList(id, scoreUpdate = 1){
        const out = this._virtual[id];

        this._deleteCacheSortedList(id);
        out.sortedListScore += scoreUpdate;
        this._addCacheSortedList(id);

        return out;
    }

    _deleteCacheSortedList(id){
        ArrayHelper.removeSortedArray( this._virtual[id], this._virtualList, (a,b) => a.sortedListScore - b.sortedListScore );
    }

    _addCacheSortedList(id){

        if (this._virtualList.length >= this._scope.argv.settings.hashMapVirtualCacheSize ){
            const data = this._virtualList[0];
            delete this._virtual[data.id];
            this._virtualList.splice(0, 1);
        }

        return ArrayHelper.addSortedArray( this._virtual[id], this._virtualList, (a,b) => a.sortedListScore - b.sortedListScore );
    }

}