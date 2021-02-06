const BN  = require("bn.js")

module.exports = class MarshalValidationPreProcessing{

    static preprocessing_bigNumber(value){
        return (typeof value === "string" || typeof value === "number") ? new BN(value) : value;
    }

    static preprocessing_number(value){
        return (typeof value === "string") ? Number.parseInt(value) : value;
    }

    static preprocessing_string(value){
        return Buffer.isBuffer(value) ? value.toString("utf8") : value;
    }

    static preprocessing_boolean(value){

        if (typeof value === "string") {
            value = value.toLowerCase();
            if (value === "true" || value === "1") value = true;
            else if (value === "false" || value === "0") value = false;
        }

        return value;
    }

}

