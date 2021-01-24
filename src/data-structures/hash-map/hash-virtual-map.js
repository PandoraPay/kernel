const DBSchema = require.main.require("./src/db/db-generic/db-schema")
const Exception = require.main.require("./src/helpers/exception");

const HashMap = require("./hash-map")
const HashMapElement = require( "./hash-map-element");
const ArrayHelper = require( "../../helpers/array-helper");

module.exports = class HashVirtualMap extends HashMap {

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
                this._virtual[siblings[i].id] = {
                    type: "view",
                    sortedListScore: 0,
                    element: siblings[i],
                };
                this._addCache(id);
            }
            return true;

        }catch(err){

        }
    }

    async addMap ( id, data){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        const out = await this.getMap(id);

        if (out) throw new Exception(this, "Element already exists");

        let element = data;
        if (data instanceof HashMapElement === false)
            element = this._createSchemaObject({
                id: id,
                data: data instanceof DBSchema ? data.toBuffer() : data,
            }, "object", "element"); //data is provided

        if (this._hasCache(id)) this._deleteCache(id);
        this._virtual[id] = {
            type: "add",
            element,
        };

        return element;

    }

    async deleteMap( id ){

        if (!this._virtual[id])
            this._virtual[id] = { };

        if ( this._hasCache(id) ) this._deleteCache(id);
        this._virtual[id].type = "del";

        return id;

    }

    async getMap ( id ){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        if (this._virtual[id]) {

            if (this._virtual[id].type === "del") return undefined;
            if (this._virtual[id].type === "add" ) return this._virtual[id].element;
            if (this._virtual[id].type === "view") {

                //updating importance
                this._deleteCache(id);
                this._virtual[id].sortedListScore += 1;
                this._addCache(id);
                return this._virtual[id].element;
            }


        }

        const out = await this._getFallback('getMap')(id);

        if (out){

            const element = this._createSchemaObject({
                id: id,
                data: out.data instanceof DBSchema ? out.data.toBuffer() : out.data,
            }, "object", "element"); //data is provided

            this._virtual[id] = {
                id,
                type: "view",
                sortedListScore: 0,
                element,
            };

            this._addCache( id );

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
    async updateMap (id, data){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        let element = data;
        if (data instanceof HashMapElement === false)
            element = this._createSchemaObject({
                id: id,
                data: data instanceof DBSchema ? data.toBuffer() : data,
            }, "object", "element",  ); //data is provided

        if ( this._hasCache(id) ) this._deleteCache(id);

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
        return ArrayHelper.removeSortedArray( this._virtual[id], this._virtualList, (a,b) => a.sortedListScore - b.sortedListScore );
    }

    _addCache(id){

        if (this._virtualList.length >= this._scope.argv.settings.hashMapVirtualCacheSize ){
            const data = this._virtualList[0];
            delete this._virtual[data.id];
            this._virtualList.splice(0, 1);
        }

        return ArrayHelper.addSortedArray( this._virtual[id], this._virtualList, (a,b) => a.sortedListScore - b.sortedListScore );
    }

}