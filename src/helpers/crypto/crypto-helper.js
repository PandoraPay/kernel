const keccak256 = require('keccak256')
const sha256 = require( 'sha256');

class CryptoHelper{

    static dkeccak256(b) {
        return keccak256( keccak256( b ) );
    }

    static keccak256(b) {
        return keccak256( b );
    }

    static sha256(b){
        const out = sha256(b, {asBytes: true });
        return Buffer.from(out);
    }

    static dsha256(b){
        return CryptoHelper.sha256( CryptoHelper.sha256(b) );
    }

}

module.exports = CryptoHelper;