import Exception from "../helpers/exception";

const intervals = {};
let intervalsCount = 0;

export function setAsyncInterval(cb, timeout, id  = ++intervalsCount){

    intervals[id] = {
        promise: undefined,
        done: false,
        timeout: setTimeout( _asyncInterval.bind(undefined, cb, timeout, id), 1)
    };

    return id;
}

async function _asyncInterval(cb, timeout, id){

    if (!intervals[id]) return;
    if (intervals[id].done) return;

    let resolver;
    intervals[id].promise = new Promise( resolve => resolver = resolve );

    try{

        const out = await cb();
        resolver( out )

    }catch(err){
        console.error("async interval raised an error", err)
    }


    if (!intervals[id].done)
        intervals[id].timeout = setTimeout( _asyncInterval.bind(undefined, cb, timeout, id), timeout);

}

export async function clearAsyncInterval(id){

    if (!id) return;
    if (!intervals[id]) return;

    intervals[id].done = true;
    clearTimeout( intervals[id].timeout );

    let out;
    try{
        out = await intervals[id].promise;
    }catch(err){
        console.error("Clear Async Interval raised an error", err);
    }

    delete intervals[id];

    return out;

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
