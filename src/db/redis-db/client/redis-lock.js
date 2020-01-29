import Exception from "src/helpers/exception"
import GenericLock from "../../db-generic/client/generic-lock";

export default class RedisLock extends GenericLock {

    async _check(lockName, lockTimeoutDateTime, timeout){

        const result = await this._scope.client.redis.set(lockName, lockTimeoutDateTime, 'PX', timeout, 'NX');

        if (result === "OK")
            return  true;
    }

    _delete(lockName){

        return this._scope.client.redis.del(lockName);
        //return this._scope.client.redis.expire(lockName, -1);
    }


    async lock (lockName, timeout = 10000, retryDelay = 50){

        if (!lockName) throw new Exception(this, "lockName is not specified.");

        lockName = "lock:" + lockName;

        return super.lock.call(this, lockName, timeout, retryDelay);

    }
    

}

