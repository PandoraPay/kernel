import DBSchema from "../db-generic/db-schema";
import Exception from "src/helpers/exception";

export default class RedisSchema extends DBSchema{

    /**
     * Middleware used for setting up sorted fields
     */
     _setSortsMiddleware( sortKey, sortScore, infix='', table, id, remove = false,  multi){

        if (remove)
            return multi.zrem(sortKey, id || this.id );
        else 
            return multi.zadd(sortKey, sortScore, id || this.id );
        
    }

    /**
     * Add or Remove search results from Redis Database.
     * For redis a word must store all its prefixes
     */
    _setSearchesMiddleware( key, words, search, score, infix='', table, id, remove = false, multi ){

        let store = ( key, score ) => {

            let arg = [key, id||this.id ];
            let redisFct;

            //if there is a score, it must use zlist
            if ( score !== undefined ){

                if (remove) redisFct = 'zrem';
                else {
                    redisFct = 'zadd';
                    arg = [ key, score, id||this.id ];
                }

            }
            //if there isn't a score, just a simple slist
            else {

                if (remove) redisFct = 'srem';
                else redisFct = 'sadd';

            }

            return multi[redisFct]( ...arg );

        };

        words.map(  word  => {

            let substr = word.substr(0, search.startingLetters);
            let position = search.startingLetters;

            while (substr.length <= word.length){

                store(`${key}:${substr}`, score);

                if (position === word.length) break;

                substr = substr + word[position];
                position ++;
            }

        });

        return true;
    }

  
    /**
     * Delete from Redis Database. It works to delete Buffers, Hex, JASON and Objects
     */
    async _deleteMiddleware(infix, table, id, db, multi){

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        multi.del(`id:info:${infix}${table || this.table}:${id || this.id}` );
        multi.del(`data:${infix}${table || this.table}:${id || this.id}` );

        //Remove id from id:sets
        if (this._schema.saving.indexableById) {
            if (this._schema.saving.indexable) multi.zrem(`id:orders:${infix}${table || this.table}`, id || this.id)
            else multi.srem(`id:list:${infix}${table || this.table}`, id || this.id);
        }
    }



    /**
     * Save the data to Redis Database. It works to store Buffers, Hex, JASON and Objects
     */
    
    async _saveMiddleware(infix='', table, id, db, data, type, multi){

        if (infix && infix[infix.length-1] !== ':') infix += ":";

        //in case a new id is supplied it should update its saving index
        if (this._schema.saving.indexableById) {
            if (id && this._schema.saving.indexable)
                delete this._schema.saving.index;
        }

        if (type === "buffer" || type === "hex" || type === "json" )
            multi.set( `data:${infix}${table||this.table}:${id||this.id}`, data );
        else if (type === "object") {

            for (const key in data){

                let value = data[key];

                if (Array.isArray(value) || typeof value === "object" ) value = JSON.stringify(value);

                multi.hset( `data:${infix}${table||this.table}:${id||this.id}`, key, value  );
            }
        }

        //save id in the id:sets

        if (this._schema.saving.indexableById) {
            if (this._schema.saving.indexable) {

                if (this._schema.saving.index === undefined) {
                    multi.hincrby(`id:info:index`, infix + (table || this.table), 1, index => this._schema.saving.index = index);
                    const data = await multi.execAsync();
                }

                multi.hset(`id:info:${infix}${table || this.table}:${id || this.id}`, "_id", this._schema.saving.index);
                multi.zadd(`id:orders:${infix}${table || this.table}`, this._schema.saving.index, id || this.id);

            } else {

                multi.sadd(`id:list:${infix}${table || this.table}`, id || this.id);

            }
        }


        return true;
    }

    /**
     * Save the data to Redis Database. It works to store Buffers, Hex, JASON and Objects
     */
    async _getMiddleware( type, input, multi){
        
        let infix = this._infix;
        if (infix && infix[infix.length-1] !== ':') infix += ":";

        //read index
        if (this._schema.saving.indexableById && this._schema.saving.indexable)
            multi.hget(`id:info:${infix}${this.table}:${this.id}`, '_id', (index) =>  this._schema.saving.index = parseInt(index) );


        let data, isEmpty = true;
        if (type === "buffer" || type === "hex" || type === "json") {
            
            multi.get( `data:${infix}${this.table}:${this.id}`, (element)=>{

                if (element === null)
                    throw new Exception(this, "Data was not fetched", {key: `data:${infix}${this.table}:${this.id}` } );

                data = element;
                isEmpty = false;

            });

        } else if (type === "object") {

            data = {};

            const fields = this._schema.options.returnOnlyField ? [this._schema.options.returnOnlyField] : this._schema.fieldsSorted;

            for (const field of fields) {
                
                if ( this.checkProperty( "skipSaving", field )) continue;

                const key = this._schema.fields[field].keyRename ? this._schema.fields[field].keyRename : field;

                multi.hget( `data:${infix}${this.table}:${this.id}`, key, (value)=>{

                    if (value !== null && value !== undefined) {
                        data[field] = value;
                        isEmpty = false;
                    }

                });

            }

        }

        await multi.execAsync();

        if (isEmpty) data = undefined;

        return data;
    }


    /**
     * Used to export methods to new instances
     * @param schemaObject
     */

    static exportDatabaseSchemaMethods(schemaObject){

        DBSchema.exportDatabaseSchemaMethods.call( this, schemaObject );

        schemaObject._setSearches = this.prototype._setSearches.bind(schemaObject);
        schemaObject._setSorts = this.prototype._setSorts.bind(schemaObject);

    }

}

