const MarshalHelper = require( "../helpers/marshal-helper");

module.exports = class MarshalValidationPreSet{

    static preset_string(value, schemaField){

        if (typeof value === "string" && !schemaField.presetDisabled ){
            const fixedBytes = this.checkValue( schemaField.fixedBytes, "fixedBytes");

            if ( fixedBytes !== undefined && value.length !== fixedBytes)
                value = value + new Array(fixedBytes - value.length + 1).join('\0');
        }

        return value;

    }

    static preset_buffer(value, schemaField){

        if (Buffer.isBuffer(value) && !schemaField.presetDisabled ) {
            const fixedBytes = this.checkValue( schemaField.fixedBytes, "fixedBytes");

            if (fixedBytes !== undefined && value.length !== fixedBytes)
                value = Buffer.concat([value, Buffer.alloc(fixedBytes - value.length)]);
        }


        return value;

    }

}

