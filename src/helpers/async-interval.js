import Exception from "../helpers/exception";
import Helper from "src/helpers/helper"

const intervals = {};
let intervalsCount = 0;

export function setAsyncInterval(cb, timeout, id  = ++intervalsCount){

    intervals[id] = true;

    _asyncInterval(id, cb, timeout);

    return id;
}

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

export async function clearAsyncInterval(id){

    if (!id) return;
    if (!intervals[id]) return;

    delete intervals[id];

}

/**
 * it will return the callback answer
 * @param cb
 * @param timeout
 * @returns {Promise<any>}
 */
export function asyncTimeout(cb, timeout = 1000 ){

    return new Promise( resolve => {

        setTimeout( () => resolve ( cb() ), timeout );

    })

}

export function clearAsyncTimeout( id ) {

}
