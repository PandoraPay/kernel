const DBModel = require("../../db/db-generic/db-model");

const {HashMapElementSchemaBuilt} = require( "./schema/hash-map-element-schema-build")
const {HashMapSchemaBuilt} = require('./schema/hash-map-schema-build')

module.exports = class HashMapModel extends DBModel {

    constructor(scope, schema = HashMapSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = HashMapElementSchemaBuilt;
        this._childHashMapModel = undefined;
    }

    _createHashElementChild(id, data, dataType, unmarshalOptions = {}){

        const obj = this._createSimpleModelObject( this._childHashMapModel, this._childHashMapSchemaBuilt,
            "element", data, dataType, undefined, unmarshalOptions );

        if (id) obj.__data.id = id;
        return obj;
    }


    _createHashElementEmptyChild(id){
        return this._createHashElementChild(id, undefined, undefined, {loading: true} )
    }

    resetHashMap(){

    }

    // it will load and return all elements
    // not useful as it requires a lot of computation
    async findAllHashMap(){
        try{

            const element = this._createHashElementEmptyChild()
            return element.findAllSiblings(  );

        }catch(err){

        }
    }

    async clearHashMap( ){

        try{

            const element = this._createHashElementEmptyChild();
            return element.deleteAllSiblings(  );

        }catch(err){
            
        }

    }

    async addMap ( id, data, dataType ){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        let element = data;
        if (!(data instanceof DBModel))
            element = this._createHashElementChild( id, data, dataType);

        await element.save();

        return element;

    }

    async deleteMap( id ){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            let element = await this.getMap(id);
            await element.delete();

            return element.id;

        }catch(err){

        }

    }

    async existsMap(id){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            const element = this._createHashElementEmptyChild(id);
            return element.exists();

        }catch(err){

        }

        return false;
    }

    async getMap ( id ){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            const element = this._createHashElementEmptyChild( id )
            await element.load();

            return element;

        }catch(err){

        }

    }

    /**
     * Update will also create it if it doesn't exist
     * @param id
     * @param data
     * @returns {Promise<*>}
     */
    async updateMap (id, data, dataType, unmarshalOptions ){

        if (Buffer.isBuffer(id)) id = id.toString("hex");

        //delete is necessary because a more complex object could be spanned
        const element = await this.getMap(id);
        if (element)
            await element.delete();

        return this.addMap(id, data, dataType, unmarshalOptions);

    }

}
