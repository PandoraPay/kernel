/**
 * It uses promises to make it sure the connection to the Database was established
 */

const Exception = require( "../../helpers/exception")
const Marshal = require("../../marshal/marshal");
const DBMarshal = require("./db-marshal");

module.exports = class GenericDatabase{

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

            if (schema.prototype instanceof DBMarshal){
                const obj = new schema( {...this._scope, db: this}, undefined, undefined, undefined, creationOptions );
                this._scope.schema.exportDatabaseSchemaMethods( obj );
                return obj;
            }
            else
                throw new Exception(this, "schema is a marshal not a DBMarshal");

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
                
                const obj = new modelClass({ ...this._scope, db: this, }, undefined, undefined, undefined, creationOptions);

                //this._scope.logger.info(this, `Loading index ${index} ${it}`);

                await obj.load(it, infix, table, );
                
                return obj;
                
            }));

            return results;

        } else {
            const obj = new modelClass({...this._scope, db: this}, undefined, undefined, undefined, creationOptions);
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

            const obj = new modelClass({...this._scope, db: this}, undefined, undefined, undefined, creationOptions);
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

    async count ( modelClass, infix = '', table, creationOptions ){
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

}

