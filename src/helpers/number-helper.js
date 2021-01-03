import MarshalData from "src/marshal/data/marshal-data"

export default class NumberHelper{

    static marshalNumber(num){
        return MarshalData.marshalNumber(num)
    }

    static unmarshalNumber(b, size = 7){
        return MarshalData.unmarshalNumber(b, size);
    }

    static convertDecimalToHex(number, fixedBytes = 32){

        const str = number.toString(16);
        if (!fixedBytes) return str;

        return Array( 2 * fixedBytes - str.length + 1 ).join('0')  + str;

    }

}