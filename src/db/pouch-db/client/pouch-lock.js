import Exception from "src/helpers/exception"
import GenericLock from "../../db-generic/client/generic-lock";

class PouchLock extends GenericLock  {

    async _check(lockName, lockTimeoutDateTime){

        const result = await this._scope.client.get("lock", lockName);

        if (!result || result.timeout < Date.now()) {

            const result2 = await this._scope.client.save("lock", lockName, {timeout: lockTimeoutDateTime});

            if (result2) {
                //TODO check if deadlock is really mine
                return true;
            }

        }
    }

    _delete(lockName){
        this._scope.client.delete("lock", lockName);
    }

}

export default PouchLock;