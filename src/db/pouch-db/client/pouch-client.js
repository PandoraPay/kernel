/**
 * pouchdb library and install find plugin
 */

import PouchMultiProcessor from "./pouch-multi-processor";

import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin( PouchDBFind );

import PouchCommands from "./pouch-commands"
import Exception from "src/helpers/exception";
import GenericClient from "../../db-generic/client/generic-client"
import BufferHelper from "src/helpers/buffers/buffer-helper"
import Helper from "src/helpers/helper";
import PouchLock from "./pouch-lock"

class PouchClient extends GenericClient{

    async connect(){

        if (this._scope.argv.db.selectedDB === "pouch") this._connectToPouch();
        else if (this._scope.argv.db.selectedDB === "couch") this._connectToCouch( );
        else throw new Exception(this, "selectedDB is invalid");

        try{
            await this._client.info();
        }catch(err){
            this._scope.logger.error(this, "selectedDB raised an error", err);
            throw new Exception(this, "selectedDB raised an error", err);
        }

        /**
         * Pouch Specific Instructions
         */
        this.pouch = {};

        //mapping all
        PouchCommands.map( fct => this.pouch[ typeof fct === "object" ? fct.fct : fct ] = async function ()  {

            if (!this._scope.parent._started) await this._scope.parent.connectDB();

            if ( typeof fct === "object") fct = fct.original;

            if (process.env.debug && !this._client[ fct ] )
                throw new Exception(this, "pouch function was not found", fct);

            return this._client[ fct ]( ...arguments );

        }.bind(this) );

        //temporary disable multi
        this.pouch.multi = () => this;
        this.multi = () => new PouchMultiProcessor( this._scope, this.pouch );

        this._scope.parent._connectedToDB();

    }


    _connectToPouch(){

        let path = this._scope.argv.db.pouchDB.path;

        /**
         *  LevelDB is designed that way and it doesn't allow more than a single instance of the database to be open.
         *  check if it will fail to Level DB
         */

        if ( ! BROWSER ) {

            const workerId = typeof process.env.SLAVE_INDEX !== "undefined" ? Number.parseInt( process.env.SLAVE_INDEX) : "master";

            path =  this._scope.argv.db.pouchDB.path_node + path + "_"+ workerId;

            Helper.createDirectory( this._scope.argv.db.pouchDB.path_node );

        }

        this._client = new PouchDB( path, { revs_limit: 1, auto_compaction: true } );

    }

    _connectToCouch(){

        const finalAddress = `${this._scope.argv.db.couchDB.address}:${this._scope.argv.db.couchDB.port}/${this._scope.argv.db.couchDB.db}`;
        this._client = new PouchDB( finalAddress, {revs_limit: 1, auto_compaction: true} );

        console.log("connecting to ",finalAddress)

    }

    async saveBlob(table, name, data){

        if (!data && name){
            data = name;
            name = undefined;
        }


        let revId;

        try {

            const exists = await this._client.get(table + (name ? ":" + name : ''));

            if (exists)
                revId = exists._rev;

        } catch(err) {
        }

        try{

            data = {
                _attachments:{
                    data: {
                        content_type: 'blob',
                        data: data,
                    }
                }
            };

            const out = await this._client.put({
                _id: table+ (name ? ":"+name : ''),
                ...data,
                _rev: revId,
            });


            return out;

        } catch (err){

            this._scope.logger.error(this, "Store Blob raised an error", err);

            return undefined;
        }

    }

    async save(table, name, data){

        if (!data && name){
            data = name;
            name = undefined;
        }

        //console.log("Saving ", table, name , data);

         if (typeof data  === "string")
            data = { notAnObject: data };

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        let revId;
        try {

            const exists = await this._client.get(table + (name ? ":" + name : ''));

            if (exists)
                revId = exists._rev;

        } catch (err) {
        }

        try{

            data = BufferHelper.convertAllBuffersToHex(data);

            const out = await this._client.put({
                _id: table+ (name ? ":"+name : ''),
                ...data,
                _rev: revId,
            });

            return out;

        } catch (err){

            return undefined;
        }

    }

    async getBlob(table, name){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        try{

            const out = await this._client.get( table+ (name ? ":"+name : ''), { attachments: true });

            if (out._attachments)
                return Buffer.from( out._attachments.data.data, "base64");

            return out;

        } catch (err){

            return undefined;

        }


    }

    async get(table, name){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        try{

            const out = await this._client.get( table+ (name ? ":"+name : ''), );

            if (out.notAnObject)
                return out.notAnObject;

            return out;

        } catch (err){

            return undefined;
        }

    }

    async delete(table, name){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        try{

            let exists;
            try{

                exists = await this._client.get( table + (name ? ":"+name : '') );
                if (!exists) return undefined;

            }catch(err){
                return undefined;
            }

            //console.log(exists._id, exists._rev);

            const out = await this._client.remove( exists._id, exists._rev );

            return out.ok;

        }catch (err){

            console.log(err);
            this._scope.logger.error(this, "Del raised an error", err);
            return false;
        }

    }

    async find(query){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        try{

            const out = await this._client.find(query);
            return out;

        }catch (err){
            return [];
        }
    }

    async createIndex(data){
        try{
            return this._client.createIndex(data);
        } catch (err){
            return [];
        }
    }

    async destroy(){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();


        try {

            let out = await this._client.destroy();

            if (out.ok){
                this._started = false;
                await this._scope.parent._connectNowToDB();
                return true;
            } else return false;

        } catch (err){
            this._scope.logger.error(this, "Destroy raised an error", err);
            throw err; //throw err
        }
    }

    /**
     * Quite efficient because the ids are sorted lexicographically
     * @param infix
     * @return {Promise.<boolean>}
     */
    async existsAny(infix){
        return await this.countAny(infix) > 0;
    }

    /**
     * Quite efficient because the ids are sorted lexicographically
     * @param infix
     * @return {Promise.<boolean>}
     */
    async countAny(infix){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        let out = await this._client.allDocs({
            startkey: infix,
            endkey: infix+'\uffff'
        });

        return out.rows.length;

    }



    // // POUCH specific timelock
    //
    //
    // get lockClass(){
    //     return PouchLock;
    // }
    //
    // /**
    //  * Used to create a deadlock to avoid two different instances to do the same task twice.
    //  * PouchDB has locking system in place
    //  * @param lockName
    //  * @param timeout
    //  * @returns {Promise.<function>} which is the callback to finish the deadlock
    //  */
    // async lock(lockName, timeout, retryDelay){
    //
    //     if (!this._scope.parent._started) await this._scope.parent.connectDB();
    //
    //     return PouchLock.lock(this, lockName, timeout, retryDelay)
    // }
    //
    // /**
    //  * delete all locks in the database
    //  * @returns {Promise<void>}
    //  */
    // async lockDeleteAll(){
    //
    //     if (!this._scope.parent._started) await this._scope.parent.connectDB();
    //
    //     await this.delete("lock");
    //
    // }


}

export default PouchClient;