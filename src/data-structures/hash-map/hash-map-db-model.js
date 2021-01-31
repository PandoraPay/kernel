const DBModel = require("../../db/db-generic/db-model");
const Helper = require( "../../helpers/helper");
const Exception = require("../../helpers/exception");

const {HashMapElementDBSchemaBuilt} = require( "./schema/hash-map-element-db-schema-build")

module.exports = class HashMapDBModel extends DBModel {

    constructor(scope, schema = HashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = schema;
        this._childHashMapModel = undefined;
    }

    createHashElementChild(id, data, dataType){

        const obj = this._createSimpleModelObject( this._childHashMapModel, this._childHashMapSchemaBuilt,
            "element", data, dataType, undefined );

        if (id) obj.id = id;
        return obj;
    }


    createHashElementEmptyChild(id){

        const obj = this._createSimpleModelObject( this._childHashMapModel, this._childHashMapSchemaBuilt,
            "element", undefined, undefined, undefined, {emptyObject: true} );

        if (id) obj.id = id;
        return obj;
    }

    resetHashMap(){

    }

    // it will load and return all elements
    // not useful as it requires a lot of computation
    async findAllHashMap(){
        try{

            const element = this.createHashElementEmptyChild()
            return element.findAllSiblings(  );

        }catch(err){

        }
    }

    async clearHashMap( ){

        try{

            const element = this.createHashElementEmptyChild();
            return element.deleteAllSiblings(  );

        }catch(err){
            
        }

    }

    async addMap ( id, data, dataType ){

        let element = data;
        if (!(data instanceof DBModel))
            element = this.createHashElementChild( id, data, dataType);

        await element.save();

        return element;

    }

    async deleteMap( id ){

        try{

            let element = id;
            if (!(id instanceof DBModel))
                element = await this.getMap(id);

            await element.delete();

            return element.id;

        }catch(err){

        }

    }

    async existsMap(id){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            const element = this.createHashElementEmptyChild(id);
            return element.exists();

        }catch(err){

        }

        return false;
    }

    async getMap ( id ){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            const element = this.createHashElementEmptyChild( id )
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
    async updateMap (id, data, dataType ){

        const element = await this.getMap(id);
        if (element) {

            //delete is necessary because a more complex object could be spanned
            await element.delete();

        }

        return this.addMap(id, data, dataType);

    }

}
