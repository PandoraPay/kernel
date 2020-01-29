import DBSchema from "../../db/db-generic/db-schema";
import Helper from "../../helpers/helper";
import Exception from "src/helpers/exception";
import HashMapElement from "./hash-map-element"

export default class HashMap extends DBSchema {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "hashmap",
                    fixedBytes: 7,
                },

                element: {
                    type: "object",
                    classObject: HashMapElement,
                    position: 100,

                    emptyAllowed: true,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

    resetHashMap(){

    }

    // it will load and return all elements
    // not useful as it requires a lot of computation
    async findAll(){
        try{

            const element = this._createSchemaObject({ }, "object", "element", undefined, undefined, undefined, {skipProcessingConstructionValues: true} );
            return element.findAllSiblings(  );

        }catch(err){

        }
    }

    async clearHashMap( ){

        try{

            const element = this._createSchemaObject({ }, "object", "element", undefined, undefined, undefined, {skipProcessingConstructionValues: true} );
            return element.deleteAllSiblings(  );

        }catch(err){
            
        }

    }

    async addMap ( id, data){

        let element = data;
        if (data instanceof HashMapElement === false)
            element = this._createSchemaObject({
                id: id,
                data: data,
            }, "object", "element" );

        await element.save();

        return element;

    }

    async deleteMap( id ){

        try{

            let element = id;
            if (id instanceof HashMapElement === false)
                element = this._createSchemaObject({
                    id: id,
                }, "object", "element" );

            await element.delete();

            return element.id;

        }catch(err){

        }

    }

    async getMap ( id ){

        try{

            if (Buffer.isBuffer(id)) id = id.toString("hex");

            const element = this._createSchemaObject({
                id: id,
            }, "object", "element" );

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