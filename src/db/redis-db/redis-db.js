import GenericDatabase from "../db-generic/generic-database";
import RedisSchema from "./redis-schema";
import Exception from "src/helpers/exception";

import RedisClient from "./client/redis-client"
import ArrayHelper from "../../helpers/array-helper";

export default class RedisDB extends GenericDatabase{

    constructor(scope){

        super( {
            ...scope,

            schema: RedisSchema

        });

        this.client =  new RedisClient({ ...this._scope, parent: this });
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

    async deleteAll( modelClass, infix='', table, creationOptions = {} ){

        creationOptions.skipValidation = true;

        const models = await this.findAll( modelClass, infix, table, undefined , creationOptions );
        const out = await Promise.all( models.map(  it => it.delete() ));

        if (models.length > 0 && models[0]._schema.saving.indexable ){
            if (infix && infix[infix.length-1] !== ':') infix += ":";
            await this.client.redis.hdel(`id:info:index`, infix + (table || models[0].table), ()=>{ } );
        }

        return out ;
    }

    /**
     * Return the number of objects stored in the database
     * @param modelClass
     * @param infix
     * @param table
     * @returns {Promise<void>}
     */
    async count ( modelClass, infix='', table){

        const obj = new modelClass( { ...this._scope, db: this  } );
        const count = await this.client.redis.hget( `id:info:index`, `${infix}${table||obj.table}`)

        return count ? Number.parseInt(count) : 0;

    }

    async _scanMiddleware(obj, infix, table, index, count, multi){

        if (obj._schema.saving.indexable){
            const out = await this.client.redis.zrange(`id:orders:${infix}${table || obj.table}`, index*count, (index+1) * count );
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

    async _findBySearchMiddleware( key, search, searchWords, infix, table, position, count ){

        const multi = this.client.multi();

        let dataIntersect = [] , dataUnion = [];

        searchWords = searchWords.map( word => `${key}:${word}` );

        if (search.score !== undefined) { //zlist

            //TODO optimize for certain keys
            // using zcard O(1) verify if the search result was already stored

            multi.zinterstore( `search:_outputInter`, searchWords.length, ...searchWords,  ()=>{});
            multi.zunionstore( `search:_outputUnion`, searchWords.length, ...searchWords,  ()=>{});

            multi.zrange( `search:_outputInter`, position * count, (position+1)*count-1, out => dataIntersect = out );
            multi.zrange( `search:_outputUnion`, position * count, (position+1)*count-1, out => dataUnion = out );

        }
        else { //slist

            multi.sinterstore( `search:_outputInter`, searchWords.length, ...searchWords,  ()=>{});
            multi.sunionstore( `search:_outputUnion`, searchWords.length, ...searchWords,  ()=>{});

            multi.sscan( `search:_outputInter`, position, out => dataIntersect = out );
            multi.sscan( `search:_outputUnion`, position, out => dataUnion = out );

            //args.push( position );
        }

        await multi.execAsync();

        let nextArgument, ids = [];

        if (search.score !== undefined){

            ids = ArrayHelper.unionUnique(dataIntersect, dataUnion);

            if (ids.length === 0 || ids.length < count) nextArgument = 0;
            else nextArgument = position + 1;

        } else {

            if ( dataIntersect[0] !== "0" )
                nextArgument = Number.parseInt(dataIntersect[0]);
            else
                nextArgument = Number.parseInt(dataUnion[0]);

            ids = ArrayHelper.unionUnique(dataIntersect[1], dataUnion[1]);

        }

        return {
            ids,
            nextArgument
        }

    }

    async _findBySortMiddleware( sortKey, sort, infix, table, position, count ){

        return this.client.redis.zrange( sortKey, position*count, (position+1)*count-1);

    }





}

