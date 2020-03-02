const fs = require('fs');
import Exception from "src/helpers/exception";

export default class Helper{

    static sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    static _mergeCloned(a, b ){

        let c = {};

        if (a)
            for (const key in a)
                if ( a.hasOwnProperty(key) ) {

                    if (a[key] && typeof a[key] === "object" && a[key].constructor && a[key].constructor.name === "Object")
                        c[key] = Helper._mergeCloned( {}, a[ key ]) ;
                    else
                    c[key] = a[key];

                }

        if (b)
            for (const key in b)
                if ( b.hasOwnProperty(key) ) {

                    if (typeof b[key] === "object" && b[key].constructor.name === "Object")
                        c[key] = Helper._mergeCloned(c[key] || {}, b[key]);
                    else
                        c[key] = b[key];

                }

        return c;


    }

    static _merge(a,b){

        let c = a;

        if (b)
            for (const key in b)
                if ( b.hasOwnProperty(key) ) {

                    if (b[key] && typeof b[key] === "object" && b[key].constructor && b[key].constructor.name === "Object")
                        c[key] = Helper._merge(c[key] || {}, b[key]);
                    else
                        c[key] = b[key];

                }

        return c;


    }

    /**
     * Merge two objects
     * @param a
     * @param b
     */
    static merge(a, b, clone = false){

        if (a && typeof a !== "object") throw new Exception(Helper, "a needs to be an object");
        if (b && typeof b !== "object") throw new Exception(Helper, "b needs to be an object");

        return clone ? Helper._mergeCloned(a,b) : Helper._merge(a, b);

    }

    static import(a, b){

        for (const key in b)
            if ( b.hasOwnProperty(key) ) {

                if (typeof b === "object" && b.constructor.name === "Object" &&
                    (a[key] === undefined || (typeof a[key] === "object" && a.constructor.name === "Object"  ))){

                    if (a[key] === undefined) a[key] = {};

                    Helper.import(a[key], b[key]);
                }
                else
                    a[key] = b[key];

            }

        for (const key in a)
            if (typeof a[key] === "function")
                a[key].bind(a[key]);

        return a;
    }

    static promiseTimeout(promise, ms = 1000){

        // Create a promise that rejects in <ms> milliseconds
        const timeout = new Promise((resolve, reject) => setTimeout(() =>  reject("promise timeout"), ms) );

        // Returns a race between our timeout and the passed in promise
        return Promise.race([
            promise,
            timeout
        ])

    }

    static waitUntilCondition(cb, interval = 1000, maxTime = 10000){

        let finished = false;

        // Create a promise that rejects in <ms> milliseconds
        const timeout = new Promise((resolve, reject) =>
            setTimeout(() => {
                finished = true;
                reject("waitUntilCondition timeout");
            }, maxTime)
        );

        const promise = new Promise( async (resolve) => {

            while ( !finished ){

                if ( await cb() ){
                    finished = true;
                    resolve(true);
                    return;
                }

                await Helper.sleep(interval);

            }

        });

        return Promise.race([
            promise,
            timeout
        ])

    }

    static createDirectory(path){

        if (BROWSER)
            return;

        try {
            if (!fs.existsSync(path))
                fs.mkdirSync(path);
        } catch (err){
            if (err.code !== 'EEXIST') {
                console.error("Error creating log directory");
                throw err;
            }
        }

    }
    static encodeVersion(v){

        if (typeof v === "number" && v % 1 !== 0) v = v.toString();
        if (typeof v === "number") return v;

        const major = v.substr( 0, v.indexOf(".") );
        const minor = v.substr( v.indexOf(".")+1, );

        return Number.parseInt(major) * 65536 + Number.parseInt(minor);
    }

    static decodeVersion(v){

        if (typeof v === "string"){
            return v;
        }

        const major = v / 65536;
        const minor = v % 65536;

        return `${major}:${minor}`;

    }

    static mergeSortedArrays( arr1, arr2, cb = (a, b) => a < b){

        const arr = [];
        let i = 0, j = 0;

        while (arr.length !== (arr1.length + arr2.length) - 1) {

            if ( j === arr2.length || (i < arr1.length && cb(arr1[i] , arr2[j])) ) {
                arr.push(arr1[i]);
                i++;
            } else {
                arr.push(arr2[j]);
                j++;
            }

        }
        return arr;

    }

    static printTime ( secs = new Date().getTime() ) {

        if (typeof secs === "string") secs =  parseInt(secs);

        secs = Math.floor( secs / 1000 );
        const seconds = secs % 60;
        const minutes = Math.floor(secs / 60) % 60;
        const hours   = Math.floor(secs / 3600) % 24;

        return [hours,minutes,seconds]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v,i) => v !== "00" || i > 0)
            .join(":")
    }


}

