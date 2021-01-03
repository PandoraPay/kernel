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

        this.client = new PouchClient({ ...this._scope, db: this, parent: this });
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
    async count ( modelClass, infix = '', table, creationOptions ){
        
    }

    async _scanMiddleware(obj, infix, table, index, count, multi){

        //const regex = new RegExp (`^${infix}${table||obj.table}:[\\w_]+$`);
        const out = await this.client.find( {
            selector: { _id: { $regex: `^${infix}${table||obj.table}:[\\w_]+$` }},
            skip:  index,
            limit: count,
        } );

        if (out && out.docs)
            return out.docs.map ( it => it._id.replace(`${infix}${table||obj.table}:`, "") );

        return [];
    }

}

export default PouchDB