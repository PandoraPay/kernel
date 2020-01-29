import Exception from "src/helpers/exception"

class GenericLock {

    constructor(scope){
        this._scope = scope;
    }

    async _check(lockName, timeout){

        let out;

        if (this._scope.masterCluster.isMasterCluster) {

            if ( this._scope.masterCluster.lockSet )
                out = this._scope.masterCluster.lockSet({ lockName, lockTime: timeout}, process);
            else
                out = {result: true}; // no masterCluster.lockSet
        }
        else
            out = await this._scope.masterCluster.sendMessage("lock-set", { lockName, lockTime: timeout});

        if (out.result)
            return true;

    }

    async _acquireLock( lockName, timeout, retryDelay = -1) {

        let resolve;
        const promise = new Promise( async promiseResolve =>{
            resolve = promiseResolve;
        });

        const retry = () => setTimeout( check.bind(this), retryDelay);


        const check = async () => {

            const lockTimeoutTime = Date.now() + timeout + 1;

            try {


                if ( await this._check(lockName, timeout) )
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

        const masterCluster = this._scope.masterCluster;

        let out;
        if (masterCluster.isMasterCluster) {

            if (masterCluster.lockDelete )
                out = masterCluster.lockDelete({ lockName}, process);
            else
                out = {result: true};
        }
        else
            out = await masterCluster.sendMessage("lock-delete", { lockName } );

        if (out.result)
            return true;

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

export default GenericLock;