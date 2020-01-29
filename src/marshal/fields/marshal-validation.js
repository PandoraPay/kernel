import Marshal from "./../marshal"
import Exception from "src/helpers/exception";
import BN from "bn.js"
import MarshalHelper from "./../helpers/marshal-helper"
import MarshalFields from "./marshal-fields";

export default class MarshalValidation{

    static validate_bigNumber(value, schemaField){

        if (value instanceof BN === false) throw "Value is not a BigNumber";

        if (value.lt( new BN(0) )) throw "Value is less than 0";

        if ( value.lt( MarshalHelper.checkValue.call( this, schemaField.minSize, "minSize") ) ) throw "Value is less than minSize";
        if ( value.gt( MarshalHelper.checkValue.call( this, schemaField.maxSize, "maxSize") ) ) throw "Value is higher than maxSize";

    }

    static validate_number(value, schemaField){

        if (typeof value !== "number") throw "Value is not a number";

        if (!MarshalValidation.isInt(value)) throw "Value is not integer";

        if ( value < 0)throw "Value is less than 0";
        if (value >= Math.MAX_SAFE_INTEGER ) throw "Value is larger than MAX_SAFE_INTEGER";

        if ( value < MarshalHelper.checkValue.call( this, schemaField.minSize, "minSize") ) throw "Value is less than minSize";
        if ( value > MarshalHelper.checkValue.call( this, schemaField.maxSize, "maxSize") ) throw "Value is higher than maxSize";

    }

    static validate_array(value, schemaField){

        if ( !Array.isArray(value) ) throw "Value is not an array";

        for (let it=0; it<value.length; it++ ) {
            if (! (value[it] instanceof Marshal) ) throw "Object in array is not a marshaling object";
            if (! value[it].validate() ) throw "Object in array is not valid";
        }

        MarshalValidation._validateFieldArray.call( this, value, schemaField );

    }

    static validate_string(value, schemaField){

        if (typeof value !== "string") throw "Value is not a string";

        MarshalValidation._validateFieldArray.call( this, value, schemaField );

    }

    static validate_boolean(value, schemaField){

        if (typeof value !== "boolean") throw "Value is not a boolean";

    }

    static validate_buffer(value, schemaField){

        if ( !Buffer.isBuffer(value) ) throw "Type is not a Buffer";

        MarshalValidation._validateFieldArray.call( this, value, schemaField);

    }

    static validate_object(value, schemaField){

        if ( !value ) {
            const emptyAllowed = MarshalHelper.checkValue.call(this, schemaField.emptyAllowed, "emptyAllowed");
            if (emptyAllowed) return true;
        }

        if (!(value instanceof Marshal)) throw "Object is not a marshaling object";
        if (! value.validate()) throw "Object was not validated";
    }



    static _validateSearchField(name, value, schemaField, schemaSearch){

        try{

            if ( !schemaSearch.name && typeof schemaSearch.name !== "string" )  throw "search name is not set.";
            if ( typeof schemaSearch.type !== "string" || !["value", "words"].includes(schemaSearch.type) )  throw "search type is not correctly set.";
            if ( typeof schemaSearch.startingLetters !== "number" || schemaSearch.startingLetters < 0 )  throw "search startingLetters is not correctly set.";

            if ( schemaSearch.score && typeof schemaSearch.score !== "function" && typeof schemaSearch.score !== "number") throw "search score call is not a function.";

        } catch (err){
            throw new Exception(this, "Invalid Field."+ err, { name: name, value: value, schemaField: schemaField, schemaSearch: schemaSearch });
        }

        return true;

    }

    static _validateSortField(name, value, schemaField, schemaSort){

        try{

            if ( !schemaSort.name && typeof schemaSort.name !== "string" )  throw "search name is not set.";
            if ( !schemaSort.score && schemaField.type !== "number") throw "sort score type is not supported.";

            if ( schemaSort.score && typeof schemaSort.score !== "function" && typeof schemaSort.score !== "number") throw "sort score call is not a function.";

        } catch (err){
            throw new Exception(this, "Invalid Field."+ err, { name: name, value: value, schemaField: schemaField, schemaSort: schemaSort });
        }

        return true;

    }



    static _validateFieldArray(value, schemaField ){

        if ( value.length > MarshalHelper.checkValue.call( this, schemaField.maxSize, "maxSize" ) ) throw "Array length is larger than max value";
        if ( value.length < MarshalHelper.checkValue.call( this, schemaField.minSize, "minSize" )  && !( MarshalHelper.checkValue.call( this, schemaField.emptyAllowed, "emptyAllowed") && value.length === 0)) throw "Array length is smaller than minvalue";

    }


    static isInt(n){
        return Number(n) === n && n % 1 === 0;
    }

}

