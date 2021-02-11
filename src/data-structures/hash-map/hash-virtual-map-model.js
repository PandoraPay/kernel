const DBModel = require("../../db/db-generic/db-model")
const Exception = require("../../helpers/exception");

const HashMapModel = require("./hash-map-model")

module.exports = class HashVirtualMapModel extends HashMapModel {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, schema, data, type, creationOptions);

        this._virtual = {};
        this._fallback = undefined;
    }

    _getFallback(method){
        if (this._fallback) return this._fallback[method].bind(this._fallback);
        return super[method].bind(this);
    }

    resetHashMap(){
        this._virtual = {};
    }

    async clearHashMap( ){

        const promises = [];

        for (const id in this._virtual){

            const {type, element} = this._virtual[id];

            if (type === "add" || type === "view")
                promises.push( element.delete() );
            else if (type === "del")
                promises.push( element ? element.delete() : this._getFallback('deleteMap')(id) );

        }

        await Promise.all(promises);

        this.resetHashMap();
        return this._getFallback('clearHashMap')();

    }

    // it will load and stores all elements into the virtualMap
    async loadAllInVirtualMap(){
        try{

            const siblings = await this.findAllHashMap(  );

            for (let i=0; i < siblings.length; i++)
                this._addCache(siblings[i].id, "view", siblings[i]);

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

        return this._addCache(id, "add", element);
    }

    async deleteMap( id ){
        this._addCache(id, "del")
        return id;
    }

    async getMap ( id ){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        if (this._virtual[id]) {
            if (this._virtual[id].type === "del") return undefined;
            if (this._virtual[id].type === "add" ) return this._virtual[id].element;
            if (this._virtual[id].type === "view") return this._virtual[id].element; //updating importance
        }

        const out = await this._getFallback('getMap')(id);

        if (out) {
            const element = this._createHashElementChild( id, out, "object"); //data is provided
            return this._addCache(id, "view", element)
        }

    }

    async existsMap(id){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        if (this._virtual[id]) {
            if (this._virtual[id].type === "del") return false;
            if (this._virtual[id].type === "add" || this._virtual[id].type === "view") return true;
        }

        return this._getFallback('existsMap')(id);

    }

    /**
     * Update will also create it if it doesn't exist
     * @param id
     * @param data
     * @returns {Promise<*>}
     */
    async updateMap (id, data, dataType, unmarshalOptions){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        let element = data;
        if (!(data instanceof DBModel))
            element = this._createHashElementChild( id, data, dataType, unmarshalOptions); //data is provided

        return this._addCache(id, "add", element);
    }

    async saveVirtualMap(resetVirtualMap = true){

        const promises = [];

        for (const id in this._virtual){

            const {type, element} = this._virtual[id];

            if (type === "add" || type === "view")
                promises.push( element.save() );
            else if (type === "del")
                promises.push( element ? element.delete() : this._getFallback('deleteMap')(id) );

        }

        await Promise.all(promises);

        if (resetVirtualMap)
            this.resetHashMap();
        else {

            for (const id in this._virtual)
                if (this._virtual[id].type === "add")
                    this._virtual[id].type = "view";

        }

    }

    _addCache(id, type, element){
        this._virtual[id] = {
            type,
            element
        };
        return element;
    }

}