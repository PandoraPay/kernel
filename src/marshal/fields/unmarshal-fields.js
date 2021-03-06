const MarshalData = require( "../data/marshal-data");
const Exception = require("../../helpers/exception");
const BufferReader = require( "../../helpers/buffers/buffer-reader");
const MarshalHelper = require( "../helpers/marshal-helper");

module.exports = class UnmarshalFields {

    /**
     * BIG NUMBER
     */

    static unmarshal_bigNumber(input){
        return input;
    }

    static unmarshal_bigNumber_fromBuffer(input, schemaField, field,  type,){
        return MarshalData.unmarshalBigNumber( input, true );
    }

    /**
     * NUMBER
     */
    static unmarshal_number(input){
        return input;
    }

    static unmarshal_number_fromBuffer(input, schemaField){

        const fixedBytes = this.checkValue( schemaField.fixedBytes, "fixedBytes");

        if ( fixedBytes !== undefined )
            return  MarshalData.unmarshalNumberFixed(input, fixedBytes );
        else
            return MarshalData.unmarshalNumber( input );

    }

    /**
     * Used to unmarshal
     * @param input
     * @param schemaField
     * @returns {number|number|*}
     * @private
     */
    static _unmarshalLengthFromBuffer(input, schemaField){

        const fixedBytes = this.checkValue( schemaField.fixedBytes, "fixedBytes");

        if (fixedBytes)
            return fixedBytes;
        else
            return UnmarshalFields.unmarshal_number_fromBuffer.call(this, input, schemaField);

    }

    /**
     * STRING
     */
    static unmarshal_string(input, schemaField){
        return MarshalData.decompressString(  MarshalData.unmarshalBuffer( BufferReader.create( MarshalData.compressString( input )), this.checkValue( schemaField.fixedBytes, "fixedBytes"), false, false, true ) );
    }

    static unmarshal_string_fromBuffer(input, schemaField, field,  type, ){
        return MarshalData.unmarshalString( input, this.checkValue( schemaField.fixedBytes, "fixedBytes"), this.checkValue( schemaField.specifyLength, "specifyLength") );
    }

    /**
     * ARRAY
     */
    static unmarshal_array(input, schemaField, field, type, callbackObject, createMarshalObject, unmarshalOptions){

        const array = [];
        let element;

        for (let i=0; i<input.length; i++) {

            element = createMarshalObject( input[i], type, field, schemaField,  callbackObject, i, unmarshalOptions );

            array.push(  element );
        }

        return array;

    }

    static unmarshal_array_fromBuffer( input, schemaField, field, type, callbackObject, createMarshalObject, unmarshalOptions ){

        if ( this.checkValue( schemaField.maxSize, "maxSize" ) === 0 && this.checkValue( schemaField.minSize, "minSize") === 0) return [];

        const array = [], length = UnmarshalFields._unmarshalLengthFromBuffer.call(this, input, schemaField );
        let element;

        for (let i=0; i<length; i++) {

            element = createMarshalObject( input, type, field, schemaField,  callbackObject, i, unmarshalOptions);

            array.push(element);
        }

        return array;

    }

    /**
     * OBJECT
     */
    static unmarshal_object(input, schemaField, field, type, callbackObject, createMarshalObject, unmarshalOptions ){
        return createMarshalObject( input, type, field,  schemaField, callbackObject, undefined, unmarshalOptions );
    }

    static unmarshal_object_fromBuffer(input, schemaField, field,  type, callbackObject, createMarshalObject, unmarshalOptions){
        return createMarshalObject( input, type, field, schemaField, callbackObject, undefined, unmarshalOptions);
    }

    /**
     * BUFFER
     */
    static unmarshal_buffer(input, schemaField, field,  type, ){
        return MarshalData.unmarshalBuffer( BufferReader.create(input), this.checkValue( schemaField.fixedBytes, "fixedBytes"), this.checkValue( schemaField.removeLeadingZeros, "removeLeadingZeros"), this.checkValue( schemaField.specifyLength, "specifyLength"), true );
    }

    static unmarshal_buffer_fromBuffer(input, schemaField,  field,  type,){
        return MarshalData.unmarshalBuffer(input, this.checkValue( schemaField.fixedBytes, "fixedBytes"), this.checkValue( schemaField.removeLeadingZeros, "removeLeadingZeros"), this.checkValue( schemaField.specifyLength, "specifyLength"), false );
    }


    /**
     * BOOLEAN
     */
    static unmarshal_boolean(input){
        return !!input;
    }

    static unmarshal_boolean_fromBuffer(input, schemaField, field,  type, ){
        return MarshalData.unmarshalNumber( BufferReader.create(input), 1) === 1
    }

}



