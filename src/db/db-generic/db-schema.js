import Marshal from "src/marshal/marshal"
import Exception from "src/helpers/exception";
import Helper from "src/helpers/helper"
import MarshalData from "src/marshal/data/marshal-data"
import StringHelper from "../../helpers/string-helper";

export default class DBSchema extends Marshal{

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, schema,  data, type, creationOptions);
        
        this._infix = '';
        this._importMethodsFromDatabaseSchema();

    }

    _createSchema(data, type,  creationOptions){

        this._schema = this._schema || {};

        this._schema = Helper.merge( {

                fields: {
                    table: {
                        type: "string",
                        default: "obj",
                        fixedBytes: 3,
                        skipMarshal: true,
                        skipSaving: true,
                        skipHashing: true,
                        presetDisabled: true,
                        position: 10000,
                    },
                    id: {
                        type: "string",
                        default(schemaField) {
                            const fixedBytes = this.checkValue( schemaField.fixedBytes, "fixedBytes");
                            if (fixedBytes !== undefined) return MarshalData.makeId( fixedBytes );

                            const maxSize = this.checkValue( schemaField.maxSize, "maxSize");
                            return MarshalData.makeId( maxSize );
                        },
                        fixedBytes: 20,
                        skipMarshal: true,
                        skipSaving: true,
                        skipHashing: true,
                        presetDisabled: true,
                        unique: true,
                        position: 10002,
                    }
                },

                saving: {
                    enabled: true,
                    indexable: false,
                    indexableById: true,

                    //type: undefined,

                    saveInfixParentTable: true,
                    //saveInfixParentId: false,

                    //skipSavingAsItWasNotLoaded: false,

                    //todo
                    //storeDataNotId: false,
                }
            },
            this._schema, false);

        if (!super._createSchema.call(this, data, type,  creationOptions))
            return false;

        this._schema.fieldsWithSearches = {}; this._schema.fieldsWithSearchesLength = 0;
        this._schema.fieldsWithSorts = {}; this._schema.fieldsWithSortsLength = 0;
        this._schema.fieldsWithUniques = {}; this._schema.fieldsWithUniquesLength = 0;

        for (const key in this._schema.fields) {
            if (this._schema.fields[key].searches) { this._schema.fieldsWithSearches[key] = this._schema.fields[key].searches; this._schema.fieldsWithSearchesLength++;}
            if (this._schema.fields[key].sorts){ this._schema.fieldsWithSorts[key] = this._schema.fields[key].sorts; this._schema.fieldsWithSortsLength++; }
            if (this._schema.fields[key].unique){ this._schema.fieldsWithUniques[key] = this._schema.fields[key].unique; this._schema.fieldsWithUniquesLength++; }
        }

        return true;
    }



    _fillDefaultValues(fieldName, schemaField){

        super._fillDefaultValues.call(this, fieldName, schemaField);

        /**
         * unique
         * uniqueGlobal
         */

        //filling searches with default values
        if (schemaField.searches)
            for (const sort in schemaField.searches) {
                schemaField.searches[sort].name = schemaField.searches[sort].name || "search1";
                schemaField.searches[sort].type = schemaField.searches[sort].type || "words";
                schemaField.searches[sort].startingLetters = schemaField.searches[sort].startingLetters || 4;
            }

    }

    validateField(name, value, schemaField){

        try{

            if (!super.validateField.call(this, name, value, schemaField))
                throw "Marshal failed";

            if ( value === undefined) value = this[name];
            if ( !schemaField ) schemaField = this._schema.fields[name];

        } catch (err){
            throw new Exception(this, "Invalid Field."+ err, { name: name, value: value, schemaField: schemaField });
        }

        if (schemaField.searches)
            for (const search of schemaField.searches)
                if ( !this._validateSearchField(name, value, schemaField, schemaField.searches[search] ))
                    throw new Exception(this, "Invalid Search Field.", { name: name, value: value, schemaField: schemaField });

        if ( schemaField.sorts )
            for (const sort of schemaField.sorts)
                if ( !this._validateSortField(name, value, schemaField, schemaField.sorts[sort] ))
                    throw new Exception(this, "Invalid Sort Field.", { name: name, value: value, schemaField: schemaField });

        return true;

    }



    /**
     * Delete from Database. The method should be overwritten by Database schema connector.
     */
    async delete(infix='', table, id, db = this._scope.db, multi){

        if (!infix) infix = this._infix;
        if (infix && infix[infix.length-1] !== ':') infix += ":";

        if (!multi) multi = db.client.multi();

        if (this._schema.saving.skipSavingAsItWasNotLoaded)
            return id||this.id;

        //Remove uniqueness fields from database
        if (this._schema.fieldsWithUniquesLength > 0)
           await this._setUniqueness(infix, table, id, true, false, multi);

        //Remove search results from database
        if (this._schema.fieldsWithSearchesLength > 0)
            this._setSearches(infix, table, id, true, multi);

        //Remove sorts results from database
        if (this._schema.fieldsWithSortsLength > 0)
            this._setSorts(infix, table, id, true, multi);

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

            const promises = [];

            const objects = this.savingAdditional();

            for (const object of objects)
                promises.push(  object.delete( `${infix}${ object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : '' }${  object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : '' }`, undefined, undefined, db ) );

            const out = await Promise.all(promises);

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
    async deleteAllSiblings(infix, table, db = this._scope.db){
        return db.deleteAll(this.constructor, infix, table);
    }

    static deleteAll(db, infix, table){
        return db.deleteAll(this, infix, table);
    }

    async findAllSiblings(infix, table, db = this._scope.db){
        return db.findAll(this.constructor, infix, table);
    }

    static findAll(db, infix, table){
        return db.findAll(this, infix, table);
    }

    static findBySort(db, sortName, position, count, infix, table, creationOptions){
        return db.findBySort(this, sortName, position, count, infix, table, creationOptions );
    }

    static findBySearch(db, searchName, value, position, count, infix, table, creationOptions){
        return db.findBySearch( searchName, value, position, count, infix, table, creationOptions );
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
    async save( infix='', table, id, db, saveType, saveText, multi, marshalOptions = {} ){

        if (!this._schema.saving.enabled) return undefined;
        if ( !this.isChanged()) return {
            _id: id ||this.id,
        };

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
                    if (object._schema.options.returnOnlyField) return object.toType( saveType, saveText, ); else
                    //in case the data was not loaded
                    if (object._schema.saving.skipSavingAsItWasNotLoaded) return object.id;
                    else {

                        if (object._schema.saving.storeDataNotId) {

                            const out = object.toType(saveType, saveText, undefined );
                            return out;

                        } else {

                            const output =  object.save(`${infix}${object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : ''}${object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : ''}`, undefined, undefined, db, saveType, saveText, undefined, marshalOptions);
                            promises.push( output );

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

        //save search results in database
        if (this._schema.fieldsWithSearchesLength > 0)
            this._setSearches(infix, table, id, false, multi);

        //save sorts results in database
        if (this._schema.fieldsWithSortsLength > 0)
            this._setSorts(infix, table, id,  false, multi);

        await multi.execAsync();

        if (this.savingAdditional){

            const promises = [];

            const objects = this.savingAdditional();
            for (const object of objects)
                promises.push( object.save( `${infix}${object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : ''}${object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : ''}`, undefined, undefined, db, saveType, saveText, undefined, marshalOptions ) );

            await Promise.all(promises);

        }

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
    async load( id, infix='', table,  db, loadType, input, multi, unmarshalOptions = {}, callbackObject ){

        if (!this._schema.saving.enabled) return true;

        unmarshalOptions.loading = true;

        if (infix) this._infix = infix;
        if (id) this.id = id;
        if (db) this.db = db;
        if (table ) this.table = table;

        if (!multi) multi = this._scope.db.client.multi();

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        if (!loadType) loadType = this._schema.saving.type||this._scope.db.defaultStoringType;

        let data;

        try {

            if (input)  data = input;
            else data = await this._getMiddleware( loadType, input, multi);

            if ( !data ) throw new Exception(this, "Load raised an error", { id: id, infix:infix, table:table });

            const promises = [];

            //TODO multi can be passed on
            if (callbackObject)
                callbackObject(this, unmarshalOptions, data, loadType );

            this.fromType(data, loadType, (object, unmarshalOptions, input, ) => {

                //saving only field
                if (object._schema.options.returnOnlyField || object._schema.saving.storeDataNotId) {
                    object.fromType(input, loadType, undefined, unmarshalOptions, true);
                    object._loaded();
                    return object;
                }

                const promise = object.load( input, `${infix}${ object._schema.saving.saveInfixParentTable ? (table || this.table) + ":" : '' }${  object._schema.saving.saveInfixParentId ? (id || this.id) + ":" : '' }`, table, db, loadType, undefined, undefined, unmarshalOptions, callbackObject);
                promise.then(()=> object._loaded() );
                promises.push(promise);
                return promise;


            }, unmarshalOptions, true );

            await Promise.all( promises );

            this._loaded();
            if (this.onLoaded) this.onLoaded();

            return this;

        } catch (err){
            throw new Exception( this, "Invalid Load."+ err.toString(), { id: this.id, table: this.table, data  });
        }

    }

    _loaded(){
        this.__changes = {};
    }

    /**
     * Sorts for sorting elements by specific fields
     * @param infix
     * @param table
     * @param id
     * @param remove
     * @param multi
     * @private
     */
    _setSorts(infix, table, id, remove = false, multi) {

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        for (const field in this._schema.fieldsWithSorts){

            const schemaField = this._schema.fields[field];
            const value = this[field];

            for (const sortName in schemaField.sorts){

                const sort = schemaField.sorts[sortName];
                try {


                    let score;

                    //compute score
                    if (!remove) {

                        if (sort.filter && sort.filter.call(this, field, sort) ) continue;

                        score = sort.score;

                        if (score === undefined) score = value;
                        else if (typeof score === "function") score = score.call(this, field, value, sort);

                        if (typeof score !== "number") throw new Exception(this, "Saving Search score is invalid", {score: score});

                    }

                    const sortKey = `sorts:${sort.globalSort ? '' : infix }${table||this.table}:${sortName}`;

                    this._setSortsMiddleware( sortKey, score, infix, table, id, remove, multi );

                } catch (err) {
                    throw new Exception(this, "Saving Sorts raised an error" + err, {sort: sort});
                }

            }
        }

        return true;
        
    }

    /**
     * Middleware used for setting up sorted fields
     */
    _setSortsMiddleware( sortKey, sortScore, infix='', table, id, remove = false,  multi){

        if (remove)
            multi.del( sortKey+":"+(id||this.id), output => {} );
        else 
            multi.set( sortKey+":"+(id||this.id), { sortField: sortKey, key: id||this.id, score: sortScore}, output =>{ });

    }


    _setSearchesMiddleware( key, words, search, score, infix='', table, id, remove = false, multi ){

    }

    static processSearchValue(search, searchValue, SEARCH_MAX_WORDS){

        let out;

        //process words
        if (search.type === "words") {

            if (typeof searchValue === "string") {
                out = StringHelper.splitWords(searchValue);
                out = out.reduce((newList, word) => word.length >= search.startingLetters ? newList.concat ( word.toLowerCase() ) : newList, []);
            }

            if (out.length > SEARCH_MAX_WORDS )
                out = out.splice( 0, SEARCH_MAX_WORDS );

        } else throw new Exception(this, "search.type is invalid");

        return out;

    }

    _setSearches(infix, table, id, remove = false, multi ){

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        for (const field in this._schema.fieldsWithSearches){

            const schemaField = this._schema.fields[field];
            let value = this[field].toLowerCase();

            if ( typeof value !== "string")
                throw new Exception(this, "Value is not a string", {value: value} );

            for (const searchName in schemaField.searches){

                try {

                    const search = schemaField.searches[searchName];
                    const key = `search:${search.globalSearch ? '' : infix}${table||this.table}:${searchName}`;

                    let score  = search.score;

                    if (!remove) {

                        if (search.filter && search.filter.call(this, field, search) ) continue;

                        if (typeof score === "function") score = score.call(this, field, value, search);
                        else if (typeof score !== "number"  && score !== undefined) throw new Exception( this, "Saving Search score is invalid", {score: score});

                    }

                    let searchValue = DBSchema.processSearchValue(search, value, this._scope.argv.db.SEARCH_MAX_WORDS);

                    this._setSearchesMiddleware( key, searchValue, search, score, infix, table, id, remove, multi )


                } catch (err) {
                    throw new Exception(this, "Saving Search raised an error" + err , {  search: searchName  });
                }

            }

        }

        return true;

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
                        throw new Exception(this, "There is already an object with the same key", { key: key, value: value, id: id||this.id, found: unique  });

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

        if (timeout === -1) timeout = 24*60*60*1000;

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

    subscribeMessage( name, data, emitToMySelf ){

        if (!this.subscription) throw new Exception(this, "schema is not subscribed. Use subscribe first");

        return this.subscription.emit( { name, data}, emitToMySelf );
    }

    subscribeOn(name, callback){
        return this.subscription.on(name, callback);
    }

    idComplete(infix, table, id){
        return `${table||this.table}:${id||this.id}`;
    }


    /**
     * Used to export methods to new instances
     * @param schemaObject
     */

    static exportDatabaseSchemaMethods(schemaObject){

        schemaObject.save = this.prototype.save.bind(schemaObject);
        schemaObject.load =  this.prototype.load.bind(schemaObject);
        schemaObject._loaded =  this.prototype._loaded.bind(schemaObject);
        schemaObject.lock =  this.prototype.lock.bind(schemaObject);
        schemaObject.delete = this.prototype.delete.bind(schemaObject);

        schemaObject._saveMiddleware = this.prototype._saveMiddleware.bind(schemaObject);
        schemaObject._getMiddleware = this.prototype._getMiddleware.bind(schemaObject);
        schemaObject._deleteMiddleware = this.prototype._deleteMiddleware.bind(schemaObject);

        schemaObject._setSortsMiddleware = this.prototype._setSortsMiddleware.bind(schemaObject);
        schemaObject._setSearchesMiddleware = this.prototype._setSearchesMiddleware.bind(schemaObject);

    }

    /**
     * Given a specific Database Schema, it will override object's methods importing database specific methods
     */
    _importMethodsFromDatabaseSchema (databaseSchema) {

        if (!databaseSchema) databaseSchema = (this._scope.db && this._scope.db.schema) ? this._scope.db.schema : undefined;

        if (databaseSchema)
            databaseSchema.exportDatabaseSchemaMethods( this );

    }

    async exists(id, infix, table, db){

        try{
            await this.load(id||this.id, infix, table, db);
            return true;
        }catch(err){
            return false;
        }

    }


}
