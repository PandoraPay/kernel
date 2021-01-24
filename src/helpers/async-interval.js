const Exception = require( "../helpers/exception" );
const Helper = require( "../helpers/helper");

const intervals = {};
let intervalsCount = 0;


async function _asyncInterval(id, cb, timeout){

    while (intervals[id]){

        await Helper.sleep(timeout);

        if ( !intervals[id]) return;

        try{

            await cb();

        }catch(err){
            console.error("async interval raised an error", err)
        }

    }
}

module.exports = {

     setAsyncInterval(cb, timeout, id  = ++intervalsCount){

        intervals[id] = true;

        _asyncInterval(id, cb, timeout);

        return id;
    },

    async clearAsyncInterval(id){

        if (!id) return;
        if (!intervals[id]) return;

        delete intervals[id];

    },

    /**
     * it will return the callback answer
     * @param cb
     * @param timeout
     * @returns {Promise<any>}
     */
    asyncTimeout(cb, timeout = 1000 ){

        return new Promise( resolve => {

            setTimeout( () => resolve ( cb() ), timeout );

        })

    },

    clearAsyncTimeout( id ) {

    }

}