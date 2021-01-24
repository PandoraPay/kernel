const Helper = require.main.require("./src/helpers/helper")
const BufferHelper = require.main.require("./src/helpers/buffers/buffer-helper")
const MarshalData = require.main.require("./src/marshal/data/marshal-data");

module.exports = class TestsHelper {

    static randomNumbers(a = 0, b = Number.MAX_SAFE_INTEGER, count = 0, float = false){

        const arr = [];
        for (let i=0; i < Math.max( count, 1); i++) {

            let number = Math.floor(Math.random() * (b - a)) + a;

            if (float)
                number = number + Math.random();

            if ( !count )
                return number;

            arr.push(number);
        }

        return arr;

    }

    static randomBuffers( length = 256, count = 0 ){

        const arr = [];
        for (let i=0; i < Math.max( count, 1); i++){

            const b = BufferHelper.generateRandomBuffer(length);

            if ( !count )
                return b;

            arr.push( b );

        }

        return arr;

    }

    static fillBuffer( length = 10 ){

        const data = [];

        for (let i=0; i < length; i++)
            data[i] = MarshalData.marshalNumberFixed(i, Math.floor( Math.log2(length) / 8 ) + 1 );

        return data;
    }

}