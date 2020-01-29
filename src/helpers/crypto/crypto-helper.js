import { keccak256 } from 'js-sha3';
import sha256 from 'sha256';

class CryptoHelper{

    static dkeccak256Buffer(b) {
        return Buffer.from( keccak256( Buffer.from( keccak256( b ), "hex" ) ), "hex")
    }

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

}

export default CryptoHelper;