/**
 * pouchdb library and install find plugin
 */
const PouchDB = require('pouchdb')
const Exception = require("../../../helpers/exception");
const BufferHelper = require("../../../helpers/buffers/buffer-helper")
const Helper = require( "../../../helpers/helper");

const PouchMultiProcessor = require( "./pouch-multi-processor");
const PouchCommands = require( "./pouch-commands")
const GenericClient = require( "../../db-generic/client/generic-client")

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

        if ( !BROWSER ) {

            const workerId = typeof process.env.SLAVE_INDEX !== "undefined" ? Number.parseInt( process.env.SLAVE_INDEX) : "master";

            path =  this._scope.argv.db.pouchDB.path_node + path + "_"+ workerId;

            Helper.createDirectory( this._scope.argv.db.pouchDB.path_node );

        }

        this._client = new PouchDB( path, { revs_limit: 1, auto_compaction: true } );

    }

    _connectToCouch(){

        const finalAddress = `${this._scope.argv.db.couchDB.address}:${this._scope.argv.db.couchDB.port}/${this._scope.argv.db.couchDB.db}`;
        this._client = new PouchDB( finalAddress, {revs_limit: 1, auto_compaction: true} );

    }

    async saveBlob(table, name, data){

        if (!data && name){
            data = name;
            name = undefined;
        }
        const finalId = table + (name ? ':'+name: '');

        let revId;

        try {

            const exists = await this._client.get( finalId );

            if (exists)
                revId = exists._rev;

        } catch(err) {
            if (err.status !== 404)
                this._scope.logger.error(this, `SaveBlob Get raised an error ${ finalId }`, err);
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
                _id: finalId,
                ...data,
                _rev: revId,
            });


            return out;

        } catch (err){
            this._scope.logger.error(this, `SaveBlob raised an error ${finalId}`, err);
            return undefined;

        }

    }

    async save(table, name, data){

        if (!data && name){
            data = name;
            name = undefined;
        }

         if (typeof data  === "string")
            data = { notAnObject: data };

        if (!this._scope.parent._started) await this._scope.parent.connectDB();
        const finalId = table + (name ? ':'+name: '');

        let revId;
        try {

            const exists = await this._client.get( finalId );

            if (exists)
                revId = exists._rev;

        } catch (err) {
            if (err.status !== 404)
                this._scope.logger.error(this, `Save.Get raised an error ${finalId}`, err);
        }

        try{

            data = BufferHelper.convertAllBuffersToHex(data);

            const out = await this._client.put({
                _id: finalId,
                ...data,
                _rev: revId,
            });

            return out;

        } catch (err){
            this._scope.logger.error(this, `Save raised an error ${finalId}`, err);
            return undefined;
        }

    }

    async getBlob(table, name){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();
        const finalId = table+ (name ? ":"+name : '');

        try{

            const out = await this._client.get( finalId, { attachments: true });

            if (out._attachments)
                return Buffer.from( out._attachments.data.data, "base64");

            return out;

        } catch (err){

            this._scope.logger.error(this, `GetBlob raised an error ${finalId}`, err);
            return undefined;

        }


    }

    async get(table, name){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();
        const finalId = table+ (name ? ":"+name : '');

        try{

            const out = await this._client.get( finalId, );

            if (out.notAnObject)
                return out.notAnObject;

            return out;

        } catch (err){

            if (err.status !== 404)
                this._scope.logger.error(this, `Get raised an error ${finalId}`, err);

            return undefined;
        }

    }

    async delete(table, name){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();
        const finalId = table+ (name ? ":"+name : '');

        try{

            let exists;
            try{

                exists = await this._client.get( finalId );
                if (!exists) return undefined;

            }catch(err){
                if (err.status !== 404)
                    this._scope.logger.error(this, `Del raised an error ${finalId}`, err);

                return undefined;
            }

            //console.log(exists._id, exists._rev);

            const out = await this._client.remove( exists._id, exists._rev );

            return out.ok;

        }catch (err){
            this._scope.logger.error(this, `Del raised an error ${finalId}`, err);
            return false;
        }

    }

    async find(query){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        try{

            const out = await this._client.find(query);
            return out;

        }catch (err){
            if (err.status !== 404)
                this._scope.logger.error(this, `Find raised an error ${query}`, err);
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

        const out = await this._client.allDocs({
            startkey: infix,
            endkey: infix+'\uffff'
        });

        return out.rows.length;

    }

}

module.exports = PouchClient;