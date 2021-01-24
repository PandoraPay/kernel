const { keccak256 } = require('js-sha3');
const sha256 = require( 'sha256');

class CryptoHelper{

    static dkeccak256(b) {

        if (typeof b === "string") b = Buffer.from(b, "hex");
        return Buffer.from( keccak256( Buffer.from( keccak256( b ), "hex" ) ), "hex")
    }

    static keccak256(b) {

        if (typeof b === "string") b = Buffer.from(b, "hex");
        return Buffer.from( keccak256( b ), "hex" );

    }

    static sha256(b){

        if (typeof b === "string") b = Buffer.from(b, "hex");
        const out = sha256(b, {asBytes: true });
        return Buffer.from(out);

    }

    static dsha256(b){
        return CryptoHelper.sha256( CryptoHelper.sha256(b) );
    }

}

module.exports = CryptoHelper;