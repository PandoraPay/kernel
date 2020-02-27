var randomBytes = require('randombytes');
import isArrayBuffer from 'is-array-buffer';

class BufferHelper{

    generateRandomBuffer(length){

        return randomBytes(length);

    }

    isBufferOnlyZero(b){

        if (! b || b.length === 0 ) return true;

        for (let i=0; i < b.length; i++)
            if ( b[i] !== 0 )
                return false;

        return true;

    }

    generateEmptyBuffer(length){
        return Buffer.alloc(length);
    }

    generateMaxBuffer(length){
        const b = Buffer.alloc(length);

        for (let it = 0; it < b.length; it++)
            b[it] = 0xFF;

        return b;
    }

    convertAllBuffersToHex(obj){

        if ( Buffer.isBuffer(obj) )
            return obj.toString("hex");

        if (obj && typeof obj === "object") {


            for (const key in obj)
                if (Buffer.isBuffer(obj[key]))
                    obj[key] = obj[key].toString("hex");
                else if (typeof obj[key] === "object")
                    this.convertAllBuffersToHex(obj[key]);
        }

        return obj;
    }

    convertNumberToBuffer(number){

        let hex = number .toString(16);
        if (hex.length % 2 === 1) hex = "0" + hex;

        return Buffer.from(hex, "hex");

    }

    processBufferArray(data){

        if (data && typeof data === "object"  ) {

            if (data.hasOwnProperty('type') && data.type === "Buffer" && data.hasOwnProperty("data") ){
                data = Buffer.from(data);
                return data;
            }

            for (const prop in data) {
                if (data.hasOwnProperty(prop)) {

                    if (isArrayBuffer(data[prop]))
                        data[prop] = Buffer.from(data[prop]);
                    else
                        data[prop] = this.processBufferArray(data[prop]);

                }
            }

        }

        return data;
    }


}



export default new BufferHelper();