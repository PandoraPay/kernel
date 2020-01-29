/**
 * It uses promises to make it sure the connection to the Database was established
 */

import Exception from "src/helpers/exception"
import Marshal from "src/marshal/marshal";
import DBSchema from "./db-schema";
import StringHelper from "src/helpers/string-helper";

export default class GenericDatabase{

    constructor(scope){

        this._started = false;

        this._connectingPromise = undefined;
        this._connectingPromiseResolver = undefined;

        this._scope = scope;
        
        this.client = undefined;

        this.defaultStoringType = "object";
        this.defaultStoringText = true;
        this.name = "GenericDB";
        
    }

    get isSynchronized(){
        return true;
    }

    get schema(){
        return this._scope.schema;
    }

    createSchemaInstance(schema,  data, type, creationOptions){

        if (typeof schema  === "function"  && schema.prototype) {

            if (schema.prototype instanceof DBSchema){
                let obj = new schema( {...this._scope, db: this}, undefined, undefined, undefined, creationOptions );
                this._scope.schema.exportDatabaseSchemaMethods( obj );
                return obj;
            }


            if (schema.prototype instanceof Marshal)
                throw new Exception(this, "schema is a marshal not a DBSchema");

        }


        return new this._scope.schema({...this._scope, db: this}, schema,  data, type, creationOptions);
    }

    async connectDB(){

        if (this._started) return true;

        if (this._connectingPromise) return this._connectingPromise;
        else{

            this._connectingPromise = new Promise((resolve)=>{
                this._connectingPromiseResolver = resolve;
            });

            await this._connectNowToDB();

            return this._connectingPromise;
        }

    }

    async _connectNowToDB(){

        return this._connectedToDB();

    }

    _connectedToDB(){

        this._scope.logger.warn("DB","Connected");
        this._started = true;

        this._connectingPromiseResolver(true);
    }

    _disconnectedFromDB(){

        this._started = false;
        this._connectingPromise = undefined;
        this._connectingPromiseResolver = undefined;
        this._scope.logger.warn("DB","Disconnected");

    }

    async find( modelClass, id, infix, table, creationOptions){

        if (!this._started) await this.connectDB();

        if ( !id ) throw new Exception( modelClass.name, "Find - id was not specified", {id: id} );

        let output;

        if (Array.isArray(id)){

            //this._scope.logger.info(this, `Found ${id.length} elements`);

            const results =  Promise.all( id.map( async it => {
                
                let obj = new modelClass({ ...this._scope, db: this, }, undefined, undefined, undefined, creationOptions);

                //this._scope.logger.info(this, `Loading index ${index} ${it}`);

                await obj.load(it, infix, table, );
                
                return obj;
                
            }));

            return results;

        } else {
            let obj = new modelClass({...this._scope, db: this}, undefined, undefined, undefined, creationOptions);
            await obj.load(id, infix, table);
            output = obj;
        }

        return output;

    }

    /**
     * Delete all given ids objects
     * @param modelClass
     * @param id
     * @param infix
     * @param table
     * @returns {Promise<boolean>}
     */
    async delete( modelClass, ids, infix, table, creationOptions = {}){

        if ( !ids ) throw new Exception( modelClass.name, "Delete - ids were not specified", {ids: ids} );

        if (!Array.isArray(ids)) ids = [ids];

        creationOptions.skipValidation = true;

        return Promise.all( ids.map( async (it) => {

            let obj = new modelClass({...this._scope, db: this}, undefined, undefined, undefined, creationOptions);
            await obj.load( it, infix, table,);
            return obj.delete();

        } ) );

    }


    /**
     * Delete All objects from database
     * @param modelClass
     * @param infix
     * @param table
     */
    async deleteAll( modelClass, infix, table, creationOptions = {} ){

        creationOptions.skipValidation = true;

        const models = await this.findAll( modelClass, infix, table, undefined, creationOptions );
        return Promise.all( models.map(  it => it.delete() ));

    }

    async count ( modelClass, infix, table ){
        if (!this._started) await this.connectDB();
    }

    async _scanMiddleware(obj, infix, table, index, count, multi){

    }

    async scan( modelClass, index=0, count = 10, infix='', table,  creationOptions ){

        if (infix && infix[infix.length-1] !== ':') infix += ":";
        
        const multi = this.client.multi();

        const obj = new modelClass( { ...this._scope, db: this, }, undefined, undefined, undefined, creationOptions );

        let elements = await this._scanMiddleware(obj, infix, table||obj.table,  index, count , multi);
        elements = elements.filter ( obj => obj );

        return this.find(modelClass, elements, infix, table, creationOptions);

    }

    /**
     * Find All Objects from a specific class
     * @param modelClass
     * @param infix
     * @param table
     * @returns {Promise<Array>}
     */
    async findAll( modelClass, infix, table, count = 100000, creationOptions){

        return this.scan(modelClass, 0, count, infix, table, creationOptions);

    }

    async findModelByIndex( modelClass, position, infix, table, creationOptions){
        return this.scan(modelClass, position, 1, infix, table, creationOptions);
    }

    /**
     * Filter objects from database using searchName and searchKey
     * @param modelClass
     * @param searchName
     * @param searchKey
     * @param position
     * @param count
     * @param infix
     * @param table
     * @returns {Promise<*>}
     */
    async findBySearch( modelClass, searchName, value, position, count = 10, infix='', table, creationOptions ){

        if (!this._started) await this.connectDB();
        if (infix && infix[infix.length-1] !== ':') infix += ":";

        let obj = new modelClass({ ...this._scope, db: this, }, undefined, undefined, undefined, creationOptions);

        for (const field in obj._schema.fieldsWithSearches)
            if (obj._schema.fieldsWithSearches[field][searchName]){

                const search = obj._schema.fieldsWithSearches[field][searchName];
                const key = `search:${search.globalSearch ? '' : infix}${table||obj.table}:${searchName}`;

                let searchValue = DBSchema.processSearchValue(search, value, this._scope.argv.db.SEARCH_MAX_WORDS);

                const out = await this._findBySearchMiddleware(key, search, searchValue, infix, table, position, count);

                return {
                    data: await this.find( modelClass, out.ids, infix, table, creationOptions),
                    next: out.nextArgument,
                }

            }

        return {
            data: [],
            next: 0,
        };

    }

    async _findBySearchMiddleware( key, search, searchWords, infix, table, position, count ){
        return this.client.find( { searchKey: key, sort: "sortScore", words: searchWords, start: position*count, end: (position+1)*count-1 });
    }

    async findBySort(modelClass, sortName, position=0, count = 10, infix='', table, creationOptions){

        if (!this._started) await this.connectDB();
        if (infix && infix[infix.length-1] !== ':') infix += ":";

        let obj = new modelClass( { ...this._scope,  db: this }, undefined, undefined, undefined, creationOptions );

        for (const field in obj._schema.fieldsWithSorts)
            if ( obj._schema.fieldsWithSorts[field][sortName] ){

                const sort = obj._schema.fieldsWithSorts[field][sortName];
                const sortKey = `sorts:${sort.globalSort ? '' : infix }${table||obj.table}:${sortName}`;

                let ids = await this._findBySortMiddleware(  sortKey, sort, infix, table, position, count );

                if (ids.length === 0) return [];
                else return this.find(modelClass, ids, infix, table, creationOptions);

            }

        return [];

    }

    async _findBySortMiddleware( sortKey, sort, infix, table, position, count ){
        return this.client.find( { sortKey: sortKey, sort: "sortScore", start: position*count, end: (position+1)*count-1 });
    }

    /**
     * CPU consuming for some databases. Efficient for REDIS.
     */
    async countsAny(infix){
        if (!this._started) await this.connectDB();
    }

    /**
     * CPU consuming for some databases. Efficient for REDIS.
     */
    async existsAny(infix){
        if (!this._started) await this.connectDB();
    }

    get started(){
        return this._started;
    }

    /**
     * Some databases require special work to define the search and sorts fields
     * @param schema
     */
    async defineSchemaClassForSpecialDatabaseOps(DBSchemaClass){

    }

}

