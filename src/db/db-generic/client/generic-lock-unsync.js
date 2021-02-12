const Exception = require("../../../helpers/exception");

class GenericLock {

    constructor(scope){
        this._scope = scope;

        this._locks = {

        };

    }

    _check(lockName, timeout){

        if (this._locks[lockName])
            return false;
        else {


            this._locks[lockName] = {
                time: timeout,
                timeout: timeout ? setTimeout( ()=> delete this._locks[lockName], timeout) : undefined,
            };

            return true;
        }

    }

    async _acquireLock( lockName, timeout, retryTimes, retryDelay ) {

        let resolve;
        const promise = new Promise( async promiseResolve =>{
            resolve = promiseResolve;
        });

        const check = () => {

            if ( this._check(lockName, timeout) ) {
                const lockTimeoutTime = Date.now() + timeout + 1;
                return resolve(lockTimeoutTime);
            }

            if (retryTimes === 0) return resolve(undefined);
            else{
                retryTimes = Math.max(-1, retryTimes-1);
                return setTimeout( check.bind(this), retryDelay)
            }

        };


        check();

        return promise;

    }

    async _delete(lockName){

        if (this._locks[lockName]){
            clearTimeout( this._locks[lockName].timeout );
            delete this._locks[lockName];
            return true;
        }


    }

    async lock ( lockName, timeout = 10000, retryTimes = 2, retryDelay = 50, ){

        if (!lockName) throw new Exception(this, "lockName is not specified.");
        if (timeout === -1) timeout = 2147483647;

        const lockTimeoutTime = await this._acquireLock(lockName, timeout, retryTimes, retryDelay );

        let  lockRemoval = undefined;

        if (lockTimeoutTime) {

            lockRemoval = this._delete.bind(this, lockName);

            if (lockTimeoutTime < Date.now()) {
                await lockRemoval();
                lockRemoval = undefined;
            }


        }

        return lockRemoval;

    }

}

module.exports = GenericLock;