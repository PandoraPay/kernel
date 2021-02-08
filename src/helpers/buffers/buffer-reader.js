const StringHelper = require("../string-helper")

module.exports = class BufferReader{

    static create(buffer){
        return buffer instanceof BufferReader ? buffer :  new BufferReader(buffer)
    }

    constructor(buffer){

        if (typeof buffer === "string"){
            if (buffer === "") buffer = Buffer.alloc(0)
            else
            if (StringHelper.isHex(buffer))
                buffer = Buffer.from(buffer, "hex");
            else throw "invalid string";
        }

        if (!Buffer.isBuffer(buffer)) throw "invalid buffer input"

        this.buffer = buffer;
        this.length = buffer.length;
        this.offset = 0;

    }



    read(noBytes){

        const output = Buffer.alloc(noBytes);
        this.buffer.copy( output,   0, this.offset,        this.offset += noBytes );

        return output;

    }

    fillZerosAndRead(noZeros, noBytes){

        if (!noZeros && !noBytes) return Buffer.alloc(0);

        const output = Buffer.alloc(noZeros + noBytes);
        this.buffer.copy( output,   noZeros, this.offset,        this.offset += noBytes );

        return output;
    }

    read1Byte(){
        return this.buffer[ this.offset++ ];
    }

    lastByte(){
        return this.buffer[ this.offset ];
    }

    back(offset){
        this.offset -= offset;
    }

}

