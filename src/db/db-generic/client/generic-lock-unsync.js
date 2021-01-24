const Exception = require.main.require("./src/helpers/exception");

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

    async _acquireLock( lockName, timeout = 10000, retryDelay = -1) {

        if (timeout === -1) timeout = 24*60*60*1000;

        let resolve;
        const promise = new Promise( async promiseResolve =>{
            resolve = promiseResolve;
        });

        const retry = () => setTimeout( check.bind(this), retryDelay);


        const check = () => {

            const lockTimeoutTime = Date.now() + timeout + 1;

            try {


                if ( this._check(lockName, timeout) )
                    return resolve(lockTimeoutTime);


            } catch (err) {

            }

            if (retryDelay === -1) return resolve(undefined);
            else return retry();

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

    async lock ( lockName, timeout = 10000, retryDelay = 50){

        if (!lockName) throw new Exception(this, "lockName is not specified.");

        const lockTimeoutTime = await this._acquireLock(lockName, timeout, retryDelay);

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