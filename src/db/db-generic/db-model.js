const Marshal  = require( "../../marshal/model")

const Exception  = require( "../../helpers/exception");
const Helper  = require( "../../helpers/helper")
const MarshalData  = require( "./../../marshal/data/marshal-data")

module.exports = class DBModel extends Marshal{

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, schema,  data, type, creationOptions);

        this._infix = '';
        this._importMethodsFromDatabaseSchema();

    }

    /**
     * Delete from Database. The method should be overwritten by Database schema connector.
     */
    async delete(infix='', table, id, db = this._scope.db, multi){

        if (!infix) infix = this._infix;
        if (infix && infix[infix.length-1] !== ':') infix += ":";

        if (!multi) multi = db.client.multi();

        //Remove uniqueness fields from database
        if (this._schema.fieldsWithUniquesLength > 0)
            await this._setUniqueness(infix, table, id, true, false, multi);

        //delete data
        await this._deleteMiddleware(infix, table, id, db, multi);

        await multi.execAsync();

        //remove all children
        const promises = [];

        this.toObject( false, object => {

            //saving only field
            if (object._schema.options.returnOnlyField) return object.id;
            else {

                if (!object._schema.saving.storeDataNotId)
                    promises.push(  object.delete( `${infix}${ object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : '' }${  object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : '' }`, undefined, undefined, db ) );

            }

            return object.id ;

        });

        await Promise.all( promises );

        //deleting additional
        if (this.savingAdditional){

            const objects = this.savingAdditional();
            const promises = objects.map( object => object.delete( `${infix}${ object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : '' }${  object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : '' }`, undefined, undefined, db )  )

            await Promise.all(promises);
        }

        return id||this.id;
    }

    async _deleteMiddleware(infix, table, id, db, multi){
        multi.delete( infix + (table||this.table), id||this.id, ()=>{} );
    }

    /**
     * Remove all elements from Database. It must delete all entries
     * @param db
     * @param infix
     * @param table
     * @returns {Promise.<boolean>}
     */
    async deleteAllSiblings(infix, table, db = this._scope.db, creationOptions){
        return db.deleteAll(this.constructor, this._schema, infix, table, creationOptions);
    }

    static deleteAll(db, infix, table, creationOptions){
        return db.deleteAll(this, undefined, infix, table, creationOptions);
    }

    async findAllSiblings(infix, table, db = this._scope.db, creationOptions){
        return db.findAll(this.constructor, this._schema, infix, table, creationOptions);
    }

    static findAll(db, infix, table, creationOptions){
        return db.findAll(this, undefined, infix, table, creationOptions);
    }

    static count(db, infix, table, creationOptions){
        return db.count(this, undefined, infix, table, creationOptions);
    }

    /**
     * Middleware used to customize the save function
     */
    async _saveMiddleware(infix, table, id, data, db, type, multi){

        return multi.save( infix , id, data );

    }

    /**
     * Save the model in Database. Moreover, it stores and validates the unique fields as well. The method should be overwritten by Database schema connector.
     */
    async save( infix='', table, id, db, saveType, saveText, multi, marshalOptions = {}, willSaveItself ){

        if (!this._schema.saving.enabled) return undefined;
        // if (!this.isChanged() )
        //     console.log(this.id, 'not saved')

        if ( !this.isChanged() && !table && !id ) return { _id: id ||this.id };

        if (!infix && !table && !id) willSaveItself = true;

        marshalOptions.saving = true;

        if (!infix) infix = this._infix;
        if (infix && infix[infix.length-1] !== ':') infix += ":";

        if (!multi) multi = this._scope.db.client.multi();

        if (!saveType) saveType = this._schema.saving.type||this._scope.db.defaultStoringType;
        if (!saveText) saveText = this._schema.saving.text||this._scope.db.defaultStoringText;

        let outputData = {};

        try{

            //let's validate the unique field
            if (this._schema.fieldsWithUniquesLength > 0) {
                await this._setUniqueness(infix, table, id, false, true, multi);
                await multi.execAsync();
            }

            const returnOnlyField = this._schema.options.returnOnlyField;

            if (saveType === "buffer" || saveType === "hex" || saveType === "json" || returnOnlyField ) {
                outputData = await this.toType( saveType, saveText );
            } else
            if (saveType === "object") {

                const promises = [];

                const marshal = this.toObject( saveText, object => {

                    //saving only field
                    if (object._schema.options.returnOnlyField) {
                        const out = object.toType( saveType, saveText );
                        if (willSaveItself) object._saved();
                        return out;
                    } //in case the data was not loaded
                    else {

                        if (object._schema.saving.storeDataNotId) {

                            const out = object.toType(saveType, saveText, undefined );
                            if (willSaveItself) object._saved();
                            return out;

                        } else {

                            const promise =  object.save(`${infix}${object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : ''}${object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : ''}`, undefined, undefined, db, saveType, saveText, undefined, marshalOptions, willSaveItself);
                            promises.push( promise );

                            return object.id;

                        }

                    }

                }, marshalOptions );

                await Promise.all( promises );

                for (const field in marshal){

                    const key = this._schema.fields[field].keyRename ? this._schema.fields[field].keyRename : field;

                    outputData[key] =  await marshal[field];

                }

            }

            if ( !returnOnlyField && !this._schema.saving.storeDataNotId )
                if ( await this._saveMiddleware( infix, table, id, db, outputData,  saveType, multi ) === false )
                    throw new Exception(this, "DB Save raised an error");

        } catch (err){
            throw new Exception( this, "Invalid Save."+ err, { id: this.id, table: this.table,  });
        }

        await multi.execAsync();

        if (this.savingAdditional){

            const objects = this.savingAdditional();
            const promises = objects.map( object => object.save( `${infix}${object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : ''}${object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : ''}`, undefined, undefined, db, saveType, saveText, undefined, marshalOptions, willSaveItself ) );

            await Promise.all(promises);

        }


        if (willSaveItself)
            this._saved();

        if (this.onSaved) this.onSaved();

        //returning the id
        return {
            _id: id ||this.id,
            data: outputData,
        };

    }

    /**
     * Middleware used to customize the load function
     * Table argument was set in this.table
     */
    async _getMiddleware( loadType, input, multi){

        let infix = this._infix;
        if (infix && infix[infix.length-1] !== ':') infix += ":";

        return this._scope.db.client.get( infix+this.table, id );
    }

    /**
     * Load the model from the Database. The method should be overwritten by Database schema connector.
     */
    async load( id, infix='', table,  db, loadType, input, multi, unmarshalOptions = {}, callbackObject, willLoadItself ){

        if (!this._schema.saving.enabled) return true;

        if (!infix && !table && !id) willLoadItself = true;

        unmarshalOptions.loading = true;

        if (infix) this._infix = infix;
        if (id) this.id = id;
        if (db) this.db = db;
        if (table ) this.table = table;

        if (!multi) multi = this._scope.db.client.multi();

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        if (!loadType) loadType = this._schema.saving.type||this._scope.db.defaultStoringType;

        let data;

        if (input)  data = input;
        else data = await this._getMiddleware( loadType, input, multi);

        if ( !data ) throw new Exception(this, "Load raised an error", { id, infix, table });

        const promises = [];

        //TODO multi can be passed on
        if (callbackObject)
            callbackObject(this, unmarshalOptions, data, loadType );

        this.fromType(data, loadType, (object, unmarshalOptions, input, ) => {

            //loading only field
            if (object._schema.options.returnOnlyField || object._schema.saving.storeDataNotId) {
                object.fromType(input, loadType, undefined, unmarshalOptions, true);
                object._loaded(willLoadItself);
                return object;
            }

            const promise = object.load( input, `${infix}${ object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : '' }${  object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : '' }`, table, db, loadType, undefined, undefined, unmarshalOptions , callbackObject, willLoadItself);
            promises.push(promise);
            return promise;


        }, unmarshalOptions, true );

        await Promise.all( promises );

        this._loaded(willLoadItself);

        if (this.onLoaded) this.onLoaded();

        return this;

    }

    _loaded(willLoadItself){
        if (willLoadItself) this.__changes = {};
        delete this.__data.__hash;
    }

    _saved(){
        this.__changes = {};
    }

    /**
     * Save/Update Uniqueness Fields in Database. The method should be overwritten by Database schema connector.
     */
    async _setUniqueness(infix='', table, id, remove = false, validate = false, multi ){

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        //delete uniqueness keys
        for (const key in this._schema.fieldsWithUniques){

            let value;

            if (key === "id" && id) value = id;
            else if (key === "table" && table) value = table;
            else value = this[key];

            if ( Buffer.isBuffer( value ) ) value = value.toString("hex");

            const uniquenessKey = `uniques:${this._schema.fields[key].uniqueGlobal ? '' : infix }${table||this.table}:${key}:${value}`;

            /**
             * Validate uniqueness
             */
            if (validate){
                multi.get( uniquenessKey, unique => {

                    if ( unique && unique !== (id||this.id) )
                        throw new Exception(this, "There is already an object with the same key", { key, value, id: id||this.id, found: unique  });

                });

                /**
                 * to avoid changing them in case there is an error
                 */
                if (this._schema.fieldsWithUniquesLength > 1 && !remove)
                    await multi.execAsync();

            }

            /**
             * Remove or Save the uniquenessKey
             */
            if (remove)
                multi.del( uniquenessKey  );
            else
                multi.set( uniquenessKey, id||this.id );

        }

        return true;
    }

    /**
     * Lock Model in Database
     * @param timeout
     * @param infix
     * @param table
     * @param db
     * @returns {*|Promise<Function>|Promise<*>}
     */
    lock(timeout, retryDelay, infix='', table, db = this._scope.db){

        if (infix && infix[infix.length-1] !== ':') infix += ":";
        return db.client.lock( `${infix}${ this._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : '' }${  this._schema.saving.saveInfixParentId ? this.id + ":" : '' }`, timeout, retryDelay );

    }

    async subscribe( infix='', table, db = this._scope.db ){

        if (!this.subscription)
            this.subscription = await db.client.subscribe( `${infix}${ this._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : '' }${  this._schema.saving.saveInfixParentId ? this.id + ":" : '' }` );

        return this.subscription;

    }

    unsubscribe(){

        if (!this.subscription) throw new Exception(this, "schema is not subscribed. Use subscribe first");

        return this.subscription.off();
    }

    subscribeMessage( name, data, broadcast, emitToMySelf ){

        if (!this.subscription) throw new Exception(this, "schema is not subscribed. Use subscribe first");

        return this.subscription.emit( { name, data}, broadcast, emitToMySelf );
    }

    subscribeOn(name, callback){
        return this.subscription.on(name, callback);
    }

    idComplete(infix, table, id){
        return `${table||this.table}:${id||this.id}`;
    }


    /**
     * Used to export methods to new instances
     * @param marshalObject
     */

    static exportDatabaseSchemaMethods( marshalObject){

        marshalObject.save = this.prototype.save.bind(marshalObject);
        marshalObject.load =  this.prototype.load.bind(marshalObject);
        marshalObject._loaded =  this.prototype._loaded.bind(marshalObject);
        marshalObject._saved =  this.prototype._saved.bind(marshalObject);
        marshalObject.lock =  this.prototype.lock.bind(marshalObject);
        marshalObject.delete = this.prototype.delete.bind(marshalObject);

        marshalObject._saveMiddleware = this.prototype._saveMiddleware.bind(marshalObject);
        marshalObject._getMiddleware = this.prototype._getMiddleware.bind(marshalObject);
        marshalObject._deleteMiddleware = this.prototype._deleteMiddleware.bind(marshalObject);

    }

    /**
     * Given a specific Database Schema, it will override object's methods importing database specific methods
     */
    _importMethodsFromDatabaseSchema (databaseModel) {

        if (!databaseModel) databaseModel = (this._scope.db && this._scope.db.model) ? this._scope.db.model : undefined;

        if (databaseModel)
            databaseModel.exportDatabaseSchemaMethods( this );

    }

    async exists(id, infix, table, db){

        try{
            await this.load(id||this.id, infix, table, db);
            return true;
        }catch(err){
            return false;
        }

    }

    get getModelClass(){
        return DBModel;
    }

}
