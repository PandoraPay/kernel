import Marshal from "./../marshal"
import Exception from "src/helpers/exception";
import StringHelper from "src/helpers/string-helper";
import BN from "bn.js"
import MarshalHelper from "../helpers/marshal-helper";

export default class MarshalValidationPreProcessing{

    static preprocessing_bigNumber(value, schemaField){
        if (typeof value === "string" || typeof value === "number") value = new BN(value);
        return value;
    }

    static preprocessing_number(value, schemaField){

        if (typeof value === "string") value = Number.parseInt(value);
        return value;

    }

    static preprocessing_array(value, schemaField){

        if (typeof value === "string") value = JSON.parse(value);

        return value;

    }

    static preprocessing_string(value, schemaField){

        if (Buffer.isBuffer(value))
            value = value.toString("ascii");

        return value;

    }

    static preprocessing_boolean(value, schemaField){

        if (typeof value === "string") {
            value = value.toLowerCase();
            if (value === "true" || value === "1") value = true;
            else if (value === "false" || value === "0") value = false;
        }

        return value;

    }

    static preprocessing_buffer(value, schemaField){

        //converting array to buffer
        if (!Buffer.isBuffer(value) && Array.isArray(value) ){

            let error = false;
            for (let i=0; i < value.length; i++)
                if (value[i] < 0 || value[i] > 255)
                    error = true;

            if (!error){

                const b = Buffer.alloc(value.length);
                for (let i=0; i < value.length; i++)
                    b[i] = value[i];

                return b;

            }

        }

        return value;

    }

    static preprocessing_object(value, schemaField){

        if (typeof value === "string" && !StringHelper.isStringNumber(value) )
            try{
                value = JSON.parse(value);
            }catch(err){

            }

        return value

    }

}

