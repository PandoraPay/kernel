const Exception = require("../../../helpers/exception");

class GenericLock {

    constructor(scope){
        this._scope = scope;
    }

    async _check(lockName, timeout){

        let out;

        if (this._scope.masterCluster.isMaster) {

            if ( this._scope.masterCluster.lockSet )
                out = this._scope.masterCluster.lockSet({ lockName, lockTime: timeout}, process);
            else
                out = {result: true}; // no masterCluster.lockSet
        }
        else
            out = await this._scope.masterCluster.sendMessage("lock-set", { lockName, lockTime: timeout}, "master", false );

        if (out.result)
            return true;

    }

    async _acquireLock( lockName, timeout, retryTimes, retryDelay ) {

        let resolve;
        const promise = new Promise( async promiseResolve =>{
            resolve = promiseResolve;
        });

        const check = async () => {

            if ( await this._check(lockName, timeout) ) {
                const lockTimeoutTime = Date.now() + timeout + 1;
                return resolve(lockTimeoutTime);
            }

            if (retryTimes === 0) return resolve(undefined);
            else{
                retryTimes -= 1;
                return setTimeout( check.bind(this), retryDelay)
            }

        };


        check();

        return promise;

    }

    async _delete(lockName){

        const masterCluster = this._scope.masterCluster;

        let out;
        if (masterCluster.isMaster) {

            if (masterCluster.lockDelete )
                out = masterCluster.lockDelete({ lockName}, process);
            else
                out = {result: true};
        }
        else
            out = await masterCluster.sendMessage("lock-delete", { lockName }, "master", false );

        if (out.result)
            return true;

    }

    async lock ( lockName, timeout = 10000, retryTimes = 2, retryDelay = 50, ){

        if (!lockName) throw new Exception(this, "lockName is not specified.");
        if (timeout === -1) timeout = 365*24*60*60*1000;

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