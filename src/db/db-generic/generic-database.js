/**
 * It uses promises to make it sure the connection to the Database was established
 */

const Exception = require( "../../helpers/exception")
const DBSchemaBuild = require('../db-generic/db-schema-build')
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

    get marshal(){
        return this._scope.marshal;
    }

    createMarshalInstance( argument,  data, type, creationOptions){

        if (typeof argument  === "function"  && argument.prototype) {

            if (argument.prototype instanceof DBMarshal){
                const obj = new argument( {...this._scope, db: this}, undefined, undefined, undefined, creationOptions );
                this._scope.marshal.exportDatabaseSchemaMethods( obj );
                return obj;
            }
            else
                throw new Exception(this, "argument is a marshal so not a DBMarshal");

        }

        if (!(argument instanceof DBSchemaBuild))
            throw new Exception(this, "schema is a marshal not a DBMarshal");

        return new this._scope.marshal({...this._scope, db: this}, argument,  data, type, creationOptions);
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

    async find( marshalClass = this._scope.marshal, marshalSchemaBuilt, id, infix, table, creationOptions){

        if (!this._started) await this.connectDB();

        if ( !id ) throw new Exception( marshalClass.name, "Find - id was not specified", {id: id} );

        let output;

        if (Array.isArray(id)){

            //this._scope.logger.info(this, `Found ${id.length} elements`);

            const results =  Promise.all( id.map( async it => {
                
                const obj = new marshalClass({ ...this._scope, db: this, }, marshalSchemaBuilt, undefined, undefined, creationOptions);

                //this._scope.logger.info(this, `Loading index ${index} ${it}`);

                await obj.load(it, infix, table, );
                
                return obj;
                
            }));

            return results;

        } else {
            const obj = new marshalClass({...this._scope, db: this}, marshalSchemaBuilt, undefined, undefined, creationOptions);
            await obj.load(id, infix, table);
            output = obj;
        }

        return output;

    }

    /**
     * Delete all given ids objects
     * @param marshalClass
     * @param id
     * @param infix
     * @param table
     * @returns {Promise<boolean>}
     */
    async delete( marshalClass = this._scope.marshal, marshalSchemaBuilt, ids, infix, table, creationOptions = {}){

        if ( !ids ) throw new Exception( marshalClass.name, "Delete - ids were not specified", {ids: ids} );

        if (!Array.isArray(ids)) ids = [ids];

        creationOptions.skipValidation = true;

        return Promise.all( ids.map( async (it) => {

            const obj = new marshalClass({...this._scope, db: this}, marshalSchemaBuilt, undefined, undefined, creationOptions);
            await obj.load( it, infix, table,);
            return obj.delete();

        } ) );

    }


    /**
     * Delete All objects from database
     * @param marshalClass
     * @param infix
     * @param table
     */
    async deleteAll( marshalClass = this._scope.marshal, marshalSchemaBuilt, infix, table, creationOptions = {} ){

        creationOptions.skipValidation = true;

        const models = await this.findAll( marshalClass, marshalSchemaBuilt, infix, table, undefined, creationOptions );
        return Promise.all( models.map(  it => it.delete() ));

    }

    async count ( marshalClass = this._scope.marshal, infix = '', table, creationOptions ){
        if (!this._started) await this.connectDB();
    }

    async _scanMiddleware(obj, infix, table, index, count, multi){

    }

    async scan( marshalClass = this._scope.marshal , marshalSchemaBuilt, index=0, count = 10, infix='', table,  creationOptions ){

        if (infix && infix[infix.length-1] !== ':') infix += ":";
        
        const multi = this.client.multi();

        const obj = new marshalClass( { ...this._scope, db: this, }, marshalSchemaBuilt, undefined, undefined, creationOptions );

        let elements = await this._scanMiddleware(obj, infix, table||obj.table,  index, count , multi);
        elements = elements.filter ( obj => obj );

        return this.find(marshalClass, marshalSchemaBuilt, elements, infix, table, creationOptions);

    }

    /**
     * Find All Objects from a specific class
     * @param marshalClass
     * @param infix
     * @param table
     * @returns {Promise<Array>}
     */
    async findAll( marshalClass = this._scope.marshal, marshalSchemaBuilt, infix, table, count = 100000, creationOptions){

        return this.scan( marshalClass, marshalSchemaBuilt, 0, count, infix, table, creationOptions);

    }

    async findModelByIndex( marshalClass = this._scope.marshal, marshalSchemaBuilt, position, infix, table, creationOptions){
        return this.scan( marshalClass, marshalSchemaBuilt, position, 1, infix, table, creationOptions);
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

