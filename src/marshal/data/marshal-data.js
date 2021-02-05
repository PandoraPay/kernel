const BN = require(  'bn.js');

const Exception = require( "../../helpers/exception")
const StringHelper = require( "../../helpers/string-helper");

module.exports = class MarshalData{

    /**
     * Strings
     *
     */

    static compressString(s){
        return Buffer.isBuffer(s) ? s : Buffer.from(s, "utf8");
    }

    static decompressString(b){
        return typeof b === "string" ? b : b.toString("utf8");
    }

    static marshalString(b, fixedSize , specifyLength, trim ){
        return MarshalData.marshalBuffer( MarshalData.compressString( b ), fixedSize, false, specifyLength, trim )
    }

    static unmarshalString(b, fixedSize , specifyLength ) {
        const data = MarshalData.unmarshalBuffer(b, fixedSize, undefined, specifyLength);
        return MarshalData.decompressString(data);
    }

    static marshalBigNumber(b, ){
        return MarshalData.marshalBuffer( MarshalData.compressBigNumber( b ), undefined, false, true )
    }

    static unmarshalBigNumber(b, specifyLength = true) {
        const data = MarshalData.unmarshalBuffer( b, undefined, false, true);
        return MarshalData.decompressBigNumber(data);
    }


    /**
     * Buffers
     *
     * Trim is used by JSON when specifyLength will be false
     *
     */

    static marshalBuffer(b, fixedSize = undefined, removeLeadingZeros = false, specifyLength = false, trim = false){
        
        if (fixedSize === 0) return Buffer.alloc(0);

        if ( fixedSize !== undefined && ( specifyLength  || trim ) ) {

            let count = b.length-1;
            while (count >= 0 && b[count] === 0)
                count--;

            if (b.length-1 !== count){

                const newB = Buffer.alloc( count + 1);
                b.copy(newB, 0, 0, count + 1);

                b = newB;

            }

        }

        const array = [];

        //let's remove leading zeros
        if (removeLeadingZeros){

            let it = 0;
            while (it < b.length && b[it] === 0)
                it++;

            if (it > 0){

                const newB = Buffer.alloc(b.length - it);
                b.copy(newB, 0, it, b.length);

                b = newB;

            }

            //specify how many zeros
            array.push( MarshalData.marshalNumber(it) );

        }

        if (specifyLength )
            array.push( MarshalData.marshalNumber(b.length) );

        array.push(b);

        return Buffer.concat(array);

    }

    /**
     * Buffers
     *
     * Trim is used by JSON when specifyLength will be false
     *
     * @param b
     * @param fixedSize
     * @param removeLeadingZeros
     * @param specifyLength
     * @param trim
     * @returns {*}
     */
    static unmarshalBuffer(b, fixedSize = undefined, removeLeadingZeros = false, specifyLength = false, trim = false){

        if (fixedSize === 0) return Buffer.alloc(0);

        if ( fixedSize  && !removeLeadingZeros && !specifyLength && !trim )
            return b.read(fixedSize);

        //how many leading zeros
        const zerosRead = removeLeadingZeros ? MarshalData.unmarshalNumber(b, 7) : 0;

        //how many bytes to read
        let bytesRead;

        if ( trim ) bytesRead =  b.length - b.offset;
        else if ( specifyLength  ) bytesRead = MarshalData.unmarshalNumber(b, 7);
        else bytesRead = fixedSize - zerosRead;

        return b.fillZerosAndRead( zerosRead , bytesRead );

    }

    /**
     * Numbers
     *
     */

    /**
     * Variable-Length Encoding of Integers based on ReadVarInt
     * (Cryptonote Varint)
     * @param b {BufferReader}
     * @param size {number}
     * @return {number}
     * @constructor
     */
    static unmarshalNumber( b, size = 7){

        let r = 0, power = 1, i, byte;

        for (i = 0;  ; i++) {

            if (b.buffer.length < b.offset + 1) throw new Exception( MarshalData, "Buffer ended prematurely for varint", b);

            byte = b.read1Byte();

            r += (byte & 0x7f) * power;
            if ( (byte & 0x80) === 0 )
                break;

            if (i > size) throw new Exception( MarshalData, "Buffer size is too big", b);

            power *= 0x80;

        }

        return r;

    }

    /**
     * Variable-Length Encoding of Integers based on Uint64ToBytes
     * (Cryptonote Varint)
     * @param num
     * @return {*}
     * @constructor
     */
    static marshalNumber(num){

        if (num < 0 || num > Number.MAX_SAFE_INTEGER) throw new Exception( MarshalData, "Invalid number", num );

        const b = Buffer.alloc(8);
        let i, c;

        for (i=0; num >= 0x80; i++){

            c = (num & 0x7f);
            b[i] = c | 0x80;

            num = (num - c) / 0x80;
        }

        b[i] = num;
        i++;

        const b2 = Buffer.alloc(i);
        b.copy(b2, 0, 0, i);
        return b2;
    }


    static makeId(len) {
        return StringHelper.generateRandomId(len);
    }

    static unmarshalOneByte(b){
        return b.read1Byte();
    }

    static marshalOneByte(byte){
        let b = Buffer.alloc(1);
        b[0] = byte & 255;
        return b;
    }

    static marshalNumberFixed( num, length){

        if (length > 7) throw "marshalNumberFixed length is way too big";
        if (!length) throw "marshalNumberFixed length is not specified";

        const b = Buffer.alloc(length);

        let p = length-1;
        while (num > 0){

            b[p] = num % 256;
            num /= 256;

            p--;
        }

        return b;

    }

    static unmarshalNumberFixed(b, length){

        if (length > 7) throw "unmarshalNumberFixed length is way too big";
        if (!length) throw "marshalNumberFixed length is not specified";

        let number = 0, power = 1;

        for (let i=0; i < length; i++){

            number += b.read1Byte() * power;
            power *= 2;

        }

        return number;

    }

    /**
     * https://github.com/LiskHQ/lisk/framework/src/modules/chain/helpers/bignum.js
     * @param buf
     * @param opts
     * @returns {BigNumber|*|*|*|*|*}
     */
    static decompressBigNumber(buf,  opts = {}){


        const endian = { 1: 'big', '-1': 'little' }[opts.endian] || opts.endian || 'big';

        const size = opts.size === 'auto' ? Math.ceil(buf.length) : opts.size || 1;

        if (buf.length % size !== 0)
            throw new RangeError(
                `Buffer length (${buf.length}) must be a multiple of size (${size})`
            );

        const hex = [];
        for (let i = 0; i < buf.length; i += size) {
            const chunk = [];
            for (let j = 0; j < size; j++)
                chunk.push(buf[i + (endian === 'big' ? j : size - j - 1)]);

            hex.push(chunk.map(c => (c < 16 ? '0' : '') + c.toString(16)).join(''));
        }

        return new BN(hex.join(''), 16);

    }

    /**
     * https://github.com/LiskHQ/lisk/framework/src/modules/chain/helpers/bignum.js
     * @param number
     * @param opts
     * @returns {*}
     */
    static compressBigNumber(number,  opts = {}){

        const abs = number.abs();
        const isNeg = number.lt(0);
        let buf;
        let len;
        let ret;
        let hex = number.toString(16);

        if (typeof opts === 'string') {

            if (opts !== 'mpint')
                throw 'Unsupported Buffer representation';

            buf = abs.toBuffer({ size: 1, endian: 'big' });
            len = buf.length === 1 && buf[0] === 0 ? 0 : buf.length;

            if (buf[0] & 0x80)
                len++;

            ret = Buffer.alloc(4 + len);
            if (len > 0)
                buf.copy(ret, 4 + (buf[0] & 0x80 ? 1 : 0));

            if (buf[0] & 0x80)
                ret[4] = 0;


            ret[0] = len & (0xff << 24);
            ret[1] = len & (0xff << 16);
            ret[2] = len & (0xff << 8);
            ret[3] = len & (0xff << 0);

            // Two's compliment for negative integers
            if (isNeg)
                for (let i = 4; i < ret.length; i++)
                    ret[i] = 0xff - ret[i];


            ret[4] = (ret[4] & 0x7f) | (isNeg ? 0x80 : 0);
            if (isNeg)
                ret[ret.length - 1]++;


            return ret;
        }

        const endian =
            {
                1: 'big',
                '-1': 'little',
            }[opts.endian] ||
            opts.endian ||
            'big';

        if (hex.charAt(0) === '-')
            throw new Error('Converting negative numbers to Buffers not supported yet');


        const size =
            opts.size2 === 'auto' ? Math.ceil(hex.length / 2) : opts.size || 1;

        len = Math.ceil(hex.length / (2 * size)) * size;
        buf = Buffer.alloc(len);

        // Zero-pad the hex string so the chunks are all `size` long
        while (hex.length < 2 * len)
            hex = `0${hex}`;

        const hx = hex
            .split(new RegExp(`(.{${2 * size}})`))
            .filter(s => s.length > 0);

        hx.forEach((chunk, hxI) => {
            for (let j = 0; j < size; j++) {
                const ix = hxI * size + (endian === 'big' ? j : size - j - 1);
                buf[ix] = parseInt(chunk.slice(j * 2, j * 2 + 2), 16);
            }
        });

        return buf;
    }

}
