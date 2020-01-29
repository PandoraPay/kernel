import GenericLock from "./generic-lock";

export default class GenericClient{

    constructor(scope){
        
        this._scope = scope;
        this._client = undefined;

        this._lock = new this.lockClass({
            ...this._scope,
            client: this,
        });
    }

    get lockClass(){
        return GenericLock;
    }

    connect(){
    }

    
    async destroy(){
        
    }

    async save(table, name, data, blob){
        
    }

    async get(table, name, blob){
        
    }

    async delete(table, name){
        
    }

    async deleteAny(infix){

    }

    async existsAny(infix){

    }

    async countAny(infix){

    }

    /**
     * Subscribe
     */
    async subscribe ( channel ){

        const offs = [];

        return {

            off: async () => {

                for (let i=0; i < offs.length; i++)
                    offs[i]();

            },

            on: callback => {

                const off = this._scope.masterCluster.on( channel, callback );
                offs.push(off);

            },

            once: callback => {

                this._scope.masterCluster.once( channel, callback );

            },

            emit: (data, emitToMySelf) =>  this._scope.masterCluster.broadcastMessage( channel, data, emitToMySelf ),
        }

    }

    async unsubscribe( channel ){

        return this._scope.masterCluster.off(channel);
    }

    async subscribePublish( channel, data ){
        return this._scope.masterCluster.broadcastMessage(channel, data);
    }


    /**
     * Used to create a deadlock to avoid two different instances to do the same task twice.
     */
    async lock(lockName, timeout, retryDelay){
        return this._lock.lock(lockName, timeout, retryDelay);
    }

    lockDeleteAll(){

        const masterCluster = this._scope.masterCluster;
        if ( masterCluster.isMasterCluster){

            for (const lockName in masterCluster.locks){

                clearTimeout( masterCluster.locks[lockName]);
                delete masterCluster.locks[lockName];

            }

        }

    }

}

