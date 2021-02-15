const BN = require( "bn.js")
const Exception = require( "../../helpers/exception");

const MarshalHelper = require( "./../helpers/marshal-helper")

class MarshalValidation {

    static validate_bigNumber(value, schemaField){

        if (value instanceof BN === false) throw Error("Value is not a BigNumber");

        if (value.lt( new BN(0) )) throw Error("Value is less than 0");

        if ( value.lt( this.checkValue( schemaField.minSize, "minSize") ) ) throw Error("Value is less than minSize");
        if ( value.gt( this.checkValue( schemaField.maxSize, "maxSize") ) ) throw Error("Value is higher than maxSize");

    }

    static validate_number(value, schemaField){

        if (typeof value !== "number") throw Error("Value is not a number");

        if (!MarshalValidation.isInt(value)) throw Error("Value is not integer");

        if ( value < 0)throw Error("Value is less than 0");
        if (value >= Math.MAX_SAFE_INTEGER ) throw Error("Value is larger than MAX_SAFE_INTEGER");

        if ( value < this.checkValue( schemaField.minSize, "minSize") ) throw Error("Value is less than minSize");
        if ( value > this.checkValue( schemaField.maxSize, "maxSize") ) throw Error("Value is higher than maxSize");

    }

    static validate_array(value, schemaField){

        if ( !Array.isArray(value) ) throw Error("Value is not an array");

        for (let it=0; it<value.length; it++ ) {
            if (typeof value[it] !== "object" || !value[it].__isModel) throw Error("Object in array is not a marshaling object")
            if (! value[it].validate() ) throw Error("Object in array is not valid");
        }

        MarshalValidation._validateFieldArray.call( this, value, schemaField );

    }

    static validate_string(value, schemaField){

        if (typeof value !== "string") throw Error("Value is not a string");

        MarshalValidation._validateFieldArray.call( this, value, schemaField );

    }

    static validate_boolean(value, schemaField){

        if (typeof value !== "boolean") throw Error("Value is not a boolean");

    }

    static validate_buffer(value, schemaField){

        if ( !Buffer.isBuffer(value) ) throw Error("Type is not a Buffer");

        MarshalValidation._validateFieldArray.call( this, value, schemaField);

    }

    static validate_object(value, schemaField){

        if ( !value ) {
            const emptyAllowed = this.checkValue( schemaField.emptyAllowed, "emptyAllowed");
            if (emptyAllowed) return true;
        }

        if (typeof value !== "object" || !value.__isModel) throw Error("Object is not a marshaling object");
        if (! value.validate()) throw Error("Object was not validated");
    }




    static _validateFieldArray(value, schemaField ){

        if ( value.length > this.checkValue( schemaField.maxSize, "maxSize" ) ) throw Error("Array length is larger than max value");
        if ( value.length < this.checkValue( schemaField.minSize, "minSize" )  && !( this.checkValue( schemaField.emptyAllowed, "emptyAllowed") && value.length === 0)) throw Error("Array length is smaller than minvalue");

    }


    static isInt(n){
        return Number(n) === n && n % 1 === 0;
    }

}


module.exports = MarshalValidation;