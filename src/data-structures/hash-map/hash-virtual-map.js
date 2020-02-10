import HashMap from "./hash-map"
import Exception from "src/helpers/exception";
import HashMapElement from "./hash-map-element";

export default class HashVirtualMap extends HashMap {

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

    clearHashMap( ){

        this.resetHashMap();
        return this._getFallback('clearHashMap')();

    }

    // it will load and stores all elements into the virtualMap
    async loadAllInVirtualMap(){
        try{

            const siblings = await this.findAllHashMap(  );

            for (let i=0; i < siblings.length; i++)
                this._virtual[ siblings[i].id ] = {
                    type: "view",
                    element: siblings[i],
                };

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
                data: data,
            }, "object", "element"); //data is provided

        this._virtual[id] = {
            type: "add",
            element,
        };

        return element;

    }

    async deleteMap( id ){

        if (!this._virtual[id])
            this._virtual[id] = { };

        this._virtual[id].type = "del";

        return id;

    }

    async getMap ( id ){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        if (this._virtual[id]) {

            if (this._virtual[id].type === "del") return undefined;

            if (this._virtual[id].type === "add" || this._virtual[id].type === "view")
                return this._virtual[id].element;


        }

        return this._getFallback('getMap')(id);

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
                data: data,
            }, "object", "element",  ); //data is provided

        this._virtual[id] = {
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

    }

}