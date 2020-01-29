import RedisLock from "./redis-lock";

const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

import RedisMultiProcessor from "./redis-multi-processor"
import RedisCommands from "./redis-commands"
import Events from "src/helpers/events/events"
import GenericClient from "../../db-generic/client/generic-client";
import Exception from "src/helpers/exception";

export default class RedisClient extends GenericClient{

    constructor(scope){

        super(scope);

        this._subscriptionChannels = new Events();
    }

    async connect(){

        this._client = redis.createClient( this._scope.argv.db.redisDB.port, this._scope.argv.db.redisDB.address );

        this.redis = {};

        RedisCommands.map( fct => this.redis[ typeof fct === "object" ? fct.fct : fct ] = async function() {

            if (!this._scope.parent._started) await this._scope.parent.connectDB();

            if ( typeof fct === "object") fct = fct.original;

            if (process.env.debug && !this._client[ fct +"Async"] )
                throw new Exception(this, "Redis function was not found", fct);

            return this._client[ fct +"Async"]( ...arguments );

        }.bind(this) );

        this.multi = () => new RedisMultiProcessor( this._scope, this._client );


        this._client.on("connect", async ()=>{

            const db = this._scope.argv.db.redisDB.db;
            if ( db && db > 0)
                await this._client.selectAsync(db);

            /**
             * create redis subscribe database
             */
            if (this._channelReceived){

                this._clientSubscriber = redis.createClient( this._scope.argv.db.redisDB.port, this._scope.argv.db.redisDB.address );
                this._clientSubscriber.on( "message", this._channelReceived.bind(this) );
                this._clientPublisher = redis.createClient( this._scope.argv.db.redisDB.port, this._scope.argv.db.redisDB.address );

            }

            this._scope.parent._connectedToDB();

        });

        this._client.on('disconnect', this._scope.parent._disconnectedFromDB.bind(this) );

        
    }

    async destroy(){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        
        try {
            
            return this._client.flushdb();

        } catch (err){
            this._scope.logger.error(this, "Destroy raised an error", err);
            throw err; //throw err
        }

    }

    /**
     * In Redis, existsAny is not time consuming only O(1), but other databases are time consuming
     */
    async existsAny(infix){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        let index = 0;

        do{

            const out = await this.redis.scan( index, "MATCH", "data:"+infix+":*", "COUNT", 10 );
            index = Number.parseInt(out[0]);

            if (out[1].length > 0)
                return true;

        } while( index);

        return false;

    }

    async deleteAny(infix, redisPrefix = "data"){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        let index = 0;

        do{

            const out = await this.redis.scan( index, "MATCH", `${redisPrefix ? redisPrefix+':"' : '' }${infix}:*`, "COUNT", 10 );
            index = Number.parseInt(out[0]);

            for (let i=0; i < out[1].length; i++ )
                await this.redis.del( out[1][i] );

        } while( index);

        return false;

    }

    /**
     * In Redis, existsAny is not time consuming only O(1), but other databases are time consuming
     */
    async countAny(infix){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        const out = await this.redis.scan( 0, "MATCH", "data:"+infix+":*", "COUNT", 10000 );
        return out[1].length;

    }

    /*

    // REDIS specific lock

    get lockClass(){
        return RedisLock;
    }

    /!**
     * Used to create a deadlock to avoid two different instances to do the same task twice.
     * It creates fully non-blocking and asynchronous dead-locks using Redis using SETNX
     * It returns undefined or callback to remove the deadlock
     * @param lockName
     * @param timeout
     * @returns {Promise.<function>} which is the callback to finish the deadlock
     *!/
    async lock(lockName, timeout, retryDelay){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        return RedisLock.lock ( this, lockName, timeout,retryDelay );
    }

    /!**
     * delete all locks in the database
     * @returns {Promise<void>}
     *!/
    async lockDeleteAll(){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        //return this.redis.hdel( "lock" );
        return this.deleteAny("lock", "");

    }
    */

    /*

    // REDIS specific subscription

    async subscribe( channel ){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        const subscription = await this._clientSubscriber.subscribeAsync( channel );

        const offs = [];

        return {

            off: async () => {

                for (let i=0; i < offs.length; i++)
                    offs[i]() ;

                if ( this._subscriptionChannels.listeners(channel) === 0 )
                    await this.unsubscribe(channel);

            },

            on: callback => {

                const off = this._subscriptionChannels.on(channel, callback );
                offs.push(off);

            },

            once: callback => {
                const off = this._subscriptionChannels.on(channel, ()=> {

                    for (let i=0; i < offs.length; i++)
                        if (offs[i] === off){
                            offs.splice(i, 1);
                            break;
                        }

                    callback(...arguments);

                });
                offs.push(off);
            },

            emit: data =>  this.channelPublish( channel, data),
        }

    }

    async unsubscribe(channel){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        return this._clientSubscriber.unsubscribeAsync(channel);
    }

    async channelPublish(channel, message){

        if (!this._scope.parent._started) await this._scope.parent.connectDB();

        return this._clientPublisher.publishAsync(channel, JSON.stringify(message) );
    }

    async _channelReceived(channel, message ){

        message = JSON.parse(message);
        return this._subscriptionChannels.emit(channel, message);

    }
    */
}

