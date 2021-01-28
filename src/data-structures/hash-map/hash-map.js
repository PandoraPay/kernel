const DBMarshal = require("../../db/db-generic/db-marshal");
const Helper = require( "../../helpers/helper");
const Exception = require("../../helpers/exception");

const {SchemaBuiltHashMapElement} = require( "./schema-build-hash-map-element")

class HashMap extends DBMarshal {

    constructor(scope, schema = SchemaBuiltHashMapElement, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    resetHashMap(){

    }

    // it will load and return all elements
    // not useful as it requires a lot of computation
    async findAllHashMap(){
        try{

            const element = this._createMarshalObject({ }, "object", "element", { schemaBuiltClass: this._schema }, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true} );
            return element.findAllSiblings(  );

        }catch(err){

        }
    }

    async clearHashMap( ){

        try{

            const element = this._createMarshalObject({ }, "object", "element", { schemaBuiltClass: this._schema }, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true} );
            return element.deleteAllSiblings(  );

        }catch(err){
            
        }

    }

    async addMap ( id, data){

        let element = data;
        if (!(data instanceof DBMarshal))
            element = this._createMarshalObject({
                id: id,
                data: data,
            }, "object", "element", { schemaBuiltClass: this._schema } ); //data provided

        await element.save();

        return element;

    }

    async deleteMap( id ){

        try{

            let element = id;
            if (!(id instanceof DBMarshal))
                element = this._createMarshalObject({
                    id: id,
                }, "object", "element",  { schemaBuiltClass: this._schema }, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true} );

            await element.delete();

            return element.id;

        }catch(err){

        }

    }

    async existsMap(id){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            const element = this._createMarshalObject({
                id: id,
            }, "object", "element",  { schemaBuiltClass: this._schema }, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true} );

            return element.exists();

        }catch(err){

        }

        return false;
    }

    async getMap ( id ){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            const element = this._createMarshalObject({
                id: id,
            }, "object", "element",  { schemaBuiltClass: this._schema }, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true} );

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
    async updateMap (id, data){

        const element = await this.getMap(id);
        if (element) {

            //TODO use srem for redis schema instead of delete
            // element.data = data;
            // await element.save();

            await element.delete();

        }

        return this.addMap(id, data);

    }

}

module.exports = HashMap;
