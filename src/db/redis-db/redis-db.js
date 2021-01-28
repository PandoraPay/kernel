const Exception = require("../../helpers/exception");

const GenericDatabase = require( "../db-generic/generic-database");
const RedisMarshal = require( "./redis-marshal");

const RedisClient = require( "./client/redis-client")
const ArrayHelper = require( "../../helpers/array-helper");

module.exports = class RedisDB extends GenericDatabase{

    constructor(scope){

        super( {
            ...scope,

            marshal: RedisMarshal

        });

        this.client =  new RedisClient({ ...this._scope, db: this, parent: this });
        this.defaultStoringType = "object";
        this.defaultStoringText = true;
        
        this.name = "redis";

    }

    async _connectNowToDB(){
        return this.client.connect();
    }

    get isSynchronized(){
        return this._scope.argv.db.redisDB.differentDatabase === false;
    }

    async deleteAll( marshalClass = this._scope.marshal, marshalSchemaBuilt, infix='', table, creationOptions = {} ){

        creationOptions.skipValidation = true;

        const models = await this.findAll( marshalClass, infix, table, undefined , creationOptions );
        const out = await Promise.all( models.map(  it => it.delete() ));

        if (models.length > 0 && models[0]._schema.saving.indexable ){
            if (infix && infix[infix.length-1] !== ':') infix += ":";
            await this.client.redis.hdel(`id:info:index`, infix + (table || models[0].table), ()=>{ } );
        }

        return out ;
    }

    /**
     * Return the number of objects stored in the database
     * @param marshalClass
     * @param infix
     * @param table
     * @returns {Promise<void>}
     */
    async count ( marshalClass = this._scope.marshal, marshalSchemaBuilt, infix='', table, creationOptions){

        const obj = new marshalClass({ ...this._scope, db: this, }, undefined, undefined, undefined, creationOptions);
        const count = await this.client.redis.hget( `id:info:index`, `${infix}${table||obj.table}`)

        return count ? Number.parseInt(count) : 0;

    }

    async _scanMiddleware(obj, infix, table, index, count, multi){

        if (obj._schema.saving.indexable){
            const out = await this.client.redis.zrange(`id:orders:${infix}${table || obj.table}`, index, index + count );
            return out;
        }
        else {

            let out = [], newIndex = index;

            do{

                const sscan = await this.client.redis.sscan(`id:list:${infix}${table || obj.table}`, newIndex );
                out = out.concat( sscan[1] );

                newIndex = Number.parseInt(sscan[0]);
            } while ( newIndex );

            return out;
        }

    }



}

