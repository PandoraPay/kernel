/**
 * pouchdb is used to store required data in browser ( including plugin ) and node.js
 * The pouchdb should not store complex objects as it is not optimized for multiple blobs
 */

import GenericDatabase from "../db-generic/generic-database";

import PouchSchema from "./pouch-schema"

import PouchClient from "./client/pouch-client"

class PouchDB extends GenericDatabase{

    constructor(scope){

        super( {
            ...scope,
            schema: PouchSchema
        });

        this.client = new PouchClient({ ...this._scope, parent: this });
        this.defaultStoringType = "object";
        this.defaultStoringText = true;
        this.name = "pouch";
        
    }

    get isSynchronized(){
        return this._scope.argv.db.selectedDB === "couch";
    }

    async _connectNowToDB(){

        await this.client.connect();
        this.name = "pouch_"+this.client._client.adapter||'none';
    }

    /**
     * Return the number of objects stored in the database
     * @param modelClass
     * @param infix
     * @param table
     * @returns {Promise<void>}
     */
    async count ( modelClass, infix, table ){
        
    }

    async _scanMiddleware(obj, infix, table, index, count, multi){

        //const regex = new RegExp (`^${infix}${table||obj.table}:[\\w_]+$`);
        const out = await this.client.find( {
            selector: { _id: { $regex: `^${infix}${table||obj.table}:[\\w_]+$` }},
            skip:  index*count,
            limit: count,
        } );

        if (out && out.docs)
            return out.docs.map ( it => it._id.replace(`${infix}${table||obj.table}:`, "") );

        return [];
    }

    async _findBySearchMiddleware( key, search, searchWords, infix, table, position, count ){

        if (!Array.isArray(searchWords)) searchWords = [searchWords];

        let out;

        if (search.score !== undefined){

            out = await this.client.find({
                selector: {
                    $and: [
                        { SearchWords:  { $in: searchWords} },
                        { SearchKey:  { $eq: key} },
                        { SearchScore: {$gt: null} }
                    ]
                },
                sort: [ {"SearchScore": "asc"}],
                skip:  position*count,
                limit: count,
            });

        } else {

            out = await this.client.find({
                selector: {
                    $and: [
                        { SearchWords:  { $in: searchWords} },
                        { SearchKey:  { $eq: key} },
                    ]
                },
                skip:  position*count,
                limit: count,
            });

        }

        if (out.length === 0) return [];

        const final = [];
        for (let i =0; i < out.docs.length; i++)
            final.push(out.docs[i].key);

        return {
            ids: final,
            nextArgument: (final.length > 0) ? position+1 : 0,
        };

    }

    async _findBySortMiddleware( sortKey, sort, infix, table, position=0, count=10 ){

        const out = await this.client.find({
            selector: {
                $and: [
                    {SortKey:  { $eq: sortKey}},
                    {SortScore: {$gt: null}}
                ]
            },
            sort: [ {"SortScore": "asc"}],
            skip:  position*count,
            limit: count,
        });

        if (out.length === 0) return [];

        const final = [];
        for (let i =0; i < out.docs.length; i++)
            final.push(out.docs[i].key);

        return final;
    }

    async defineSchemaClassForSpecialDatabaseOps(DBSchemaClass){

        const obj = this.createSchemaInstance(DBSchemaClass, {}, undefined, { emptyObject: true } );

        for (const field in obj._schema.fieldsWithSearches)
            for (const search of obj._schema.fields[field].searches ) {

                await this.client.pouch.createIndex({
                    index:{
                        fields: [field],
                        name: search.name,
                    }
                })

            }
        
    }

}

export default PouchDB