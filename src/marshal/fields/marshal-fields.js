import MarshalData from "../data/marshal-data";
import Exception from "src/helpers/exception";
import MarshalHelper from "./../helpers/marshal-helper";

export default class MarshalFields {

    /**
     * BIG NUMBER
     */

    static marshal_bigNumber(data){
        return data.toString();
    }

    static marshal_bigNumber_toBuffer( data, schemaField, text, callbackObject, type, marshalOptions  ){
        return MarshalData.marshalBigNumber( data, !marshalOptions.skipMarshalForHashing );
    }

    /**
     * NUMBER
     */

    static marshal_number(data, ) {
        return data;
    }


    static marshal_number_toBuffer(data, schemaField, ){

        const fixedBytes = MarshalHelper.checkValue.call(this, schemaField.fixedBytes, "fixedBytes");

        if (fixedBytes)
            return  MarshalData.marshalNumberFixed( data, fixedBytes );
        else
            return MarshalData.marshalNumber( data );

    }



    /**
     * STRING
     */

    static marshal_string( data, schemaField, text, callbackObject, type, marshalOptions ){
        return MarshalData.decompressString(  MarshalData.marshalBuffer( MarshalData.compressString( data ), MarshalHelper.checkValue.call(this, schemaField.fixedBytes, "fixedBytes"), false, false,  !marshalOptions.skipMarshalTrimming ) );
    }

    static marshal_string_toBuffer( data, schemaField, text, callbackObject, type, marshalOptions  ){
        return MarshalData.marshalString( data, MarshalHelper.checkValue.call(this, schemaField.fixedBytes, "fixedBytes"), MarshalHelper.checkValue.call(this, schemaField.specifyLength, "specifyLength") && !marshalOptions.skipMarshalForHashing ,  );
    }


    /**
     * ARRAY
     */

    static marshal_array(data, schemaField, text, callbackObject, type, marshalOptions){

        const array = [];

        let element;
        for (const it of data) {

            if (callbackObject) element = callbackObject(it, marshalOptions, type, text);
            else element = it._marshal(type, text, callbackObject, marshalOptions);

            array.push(  element );
        }

        return array;

    }

    static marshal_array_toBuffer(data, schemaField, text, callbackObject, type, marshalOptions ){

        const b = Buffer.concat(  MarshalFields.marshal_array(data, schemaField, text, callbackObject, type, marshalOptions ) );

        if ( MarshalHelper.checkValue.call(this, schemaField.specifyLength, "specifyLength") && !marshalOptions.skipMarshalForHashing  )
            return Buffer.concat ([  MarshalFields.marshal_number_toBuffer.call(this, data.length, schemaField, text, callbackObject, type, marshalOptions), b ]);
        else
            return b;

    }


    /**
     * OBJECT
     */

    static marshal_object_toBuffer(data, schemaField, text, callbackObject, type, marshalOptions){
        return MarshalFields.marshal_object(data, schemaField, text, callbackObject, type, marshalOptions);
    }

    static marshal_object(data, schemaField, text, callbackObject, type, marshalOptions){
        if (callbackObject) return callbackObject( data, marshalOptions, type, text );
        return data._marshal(type, text, callbackObject, marshalOptions);
    }


    /**
     * BUFFER
     */


    static marshal_buffer(data, schemaField, text, callbackObject, type, marshalOptions = {}){

        data = MarshalData.marshalBuffer(data, MarshalHelper.checkValue.call(this, schemaField.fixedBytes, "fixedBytes"), MarshalHelper.checkValue.call(this, schemaField.removeLeadingZeros, "removeLeadingZeros"), false, !marshalOptions.skipMarshalTrimming );
        return text ? data.toString("hex") : data;

    }

    static marshal_buffer_toBuffer(data, schemaField, text, callbackObject, type, marshalOptions = {}){
        return MarshalData.marshalBuffer(data, MarshalHelper.checkValue.call(this, schemaField.fixedBytes, "fixedBytes"), MarshalHelper.checkValue.call(this, schemaField.removeLeadingZeros, "removeLeadingZeros"), MarshalHelper.checkValue.call(this, schemaField.specifyLength, "specifyLength") && !marshalOptions.skipMarshalForHashing && !marshalOptions.skipMarshalForHashing, );
    }

    /**
     * BOOLEAN
     */


    static marshal_boolean(data, schemaField, text){
        return text ? data.toString() : data;
    }

    static marshal_boolean_toBuffer(data){
        const b = Buffer.alloc(1);
        b[0] = data ? 1 : 0;
        return b;
    }


}

