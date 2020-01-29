import Base58 from "../helpers/base58-helper";
import StringHelper from "../helpers/string-helper";
import Exception from "../helpers/exception";
import BufferReader from "../helpers/buffers/buffer-reader";
import BN from "bn.js";
import MarshalHelper from "./helpers/marshal-helper";

const defaultValues = {

    number: minSize => minSize,
    bigNumber: minSize => new BN( minSize ),
    string:  minSize => Array( minSize + 1 ).join('X') ,
    buffer:  minSize => Buffer.alloc( minSize ),
    array:  () =>[] ,
    boolean: () => false,
    object: () => undefined,

};

const defaultValuesExist = {number: true, string: true, array: true, boolean: true, buffer: true, object: true, bigNumber: true};

export default class MarshalBase{

    constructor(scope, schema = {}, data, creationOptions = {}) {

        this._scope = {
            ...scope,
            ...creationOptions.scope||{},
        };

        this._schema = schema;

        this.__data = {
            __fields: 0,

            __hash: undefined,
        };

        this.__default = {

        };
        
        this.__changes = {
            
        };

        /**
         * call init constructor
         */
        if (this.init)
            this.init(data);

    }

    _marshal(type, text = true, callbackObject, marshalOptions = {}) {

    }


    toBuffer(callbackObject, marshalOptions) {
        return this._marshal("buffer", undefined, callbackObject, marshalOptions);
    }

    toHex(callbackObject, marshalOptions) {
        return ( this.toBuffer(callbackObject, marshalOptions)).toString("hex");
    }

    toBase58(callbackObject, marshalOptions) {
        return Base58.encode( this._marshal("buffer", undefined, callbackObject, marshalOptions) );
    }

    toJSON(text = true, callbackObject, marshalOptions) {
        return this._marshal("json", text, callbackObject, marshalOptions);
    }

    toObject(text = false, callbackObject, marshalOptions) {
        return this._marshal("object", text, callbackObject, marshalOptions);
    }

    toString(callbackObject, marshalOptions) {
        return JSON.stringify( this.toJSON(true, callbackObject, marshalOptions));
    }

    toXML(callbackObject, marshalOptions) {
        return this._marshal("xml", callbackObject, marshalOptions);
    }

    toType( saveType = "buffer", saveText, callbackObject) {

        if ( saveType === "buffer") return this.toBuffer(callbackObject);
        if ( saveType === "hex") return this.toHex( callbackObject);
        if ( saveType === "base58") return this.toBase58( callbackObject);
        if ( saveType === "json") return JSON.stringify( this.toJSON( true, callbackObject) );
        if ( saveType === "object") return this.toObject(saveText, callbackObject);

        throw "Saving raised an error. Type is not specified";
    }


    unmarshal(input, type = "buffer", callbackObject, unmarshalOptions = {}) {

    }

    _convertDataType(data, type){

        if (!type) {

            if (Buffer.isBuffer(data) || data instanceof BufferReader )
                type = "buffer";
            else
            if (typeof data === "string") {

                if (Base58.verify(data)) type = "base58";
                else
                if (StringHelper.isHex(data)) type = "hex";
                else
                    try {
                        const object = JSON.parse(data);
                        type = "json";
                    } catch (err) {

                    }

            } else
            if (typeof data === "object" )
                type = "object";
        }

        if (!type)
            throw new Exception(this, "fromType raised an error. Type is not specified");

        if (type === "json") {
            if (typeof data === "string") data = JSON.parse(data);
            return {type: "object", data: data};
        }

        if (type === "base58") {
            if (typeof data === "string") data = Base58.decode(data);
            return {type: "buffer", data: BufferReader.create(data) };
        }

        if (type === "hex") {
            if (StringHelper.isHex(data)) data = Buffer.from(data, "hex");
            return {type: "buffer", data: BufferReader.create(data) };
        }

        if (type === "buffer")
            return {type: "buffer", data: BufferReader.create(data) };

        if (type === "object")
            return {type: "object", data: data };
    }


    fromBuffer(buffer, callbackObject, marshalOptions) {
        return this.fromType(buffer, "buffer", callbackObject, marshalOptions);
    }

    fromHex(hex, callbackObject, marshalOptions) {
        return this.fromType(hex, "hex", callbackObject, marshalOptions);
    }

    fromBase58(base58, callbackObject, marshalOptions){
        return this.fromType(base58, "base58", callbackObject, marshalOptions,);
    }

    fromJSON(json, callbackObject, marshalOptions) {
        return this.fromType(json, "json", callbackObject, marshalOptions,);
    }

    fromObject(data, callbackObject, marshalOptions) {
        return this.fromType(data, "object", callbackObject, marshalOptions);
    }

    fromXML(xml) {

    }


    fromType(data, type, callbackObject, unmarshalOptions) {

        if ( data === undefined) throw new Exception(this, "fromType raised an error. Data is not specified");

        const out = this._convertDataType(data, type);
        type = out.type;
        data = out.data;

        this.unmarshal(data, type, callbackObject, unmarshalOptions);
    }


    get noFields() {
        return this.__data.__fields;
    }

    get parent(){
        return this._scope.parent;
    }

    set parent(newParent){
        this._scope.parent = newParent;
        if (this.onParentSet)
            this.onParentSet(newParent);
    }

    get parentIndex(){
        return this._scope.parentIndex;
    }

    set parentIndex(newParentIndex){
        this._scope.parentIndex = newParentIndex;
        if (this.onParentIndexSet)
            this.onParentIndexSet(newParentIndex);
    }


    /**
     * Validate only when the field is being created
     * @param name
     * @param value
     * @param schemaField
     */
    _validateFieldCreation(name, value, schemaField) {

        try {

            if (!schemaField) schemaField = this._schema.fields[name];

            if (!schemaField || typeof schemaField !== "object")
                throw "Schema was not found";

            //validate its type
            if (!schemaField.type || !defaultValuesExist[schemaField.type])
                throw "Type is invalid";

        } catch (err) {
            throw new Exception(this, "Invalid Field." + err, {
                name: name,
                value: value,
                schemaField: schemaField
            });
        }

    }

    /**
     * Fill with default Values
     * @param fieldName
     * @param schemaField
     * @private
     */
    _fillDefaultValues(fieldName, schemaField) {

        if (!schemaField.minSize)
            schemaField.minSize = function() {

                if (schemaField.type === "number") return 0;
                if (schemaField.type === "bigNumber") return new BN(0);

                if (schemaField.type === "buffer" || schemaField.type === "array" || schemaField.type === "string") return 0;

            };

        if (!schemaField.maxSize)
            schemaField.maxSize = function(){

                if (schemaField.type === "number") return Number.MAX_SAFE_INTEGER;
                if ( schemaField.type === "bigNumber" ) return new BN("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16);

                if (schemaField.type === "buffer" || schemaField.type === "array" || schemaField.type === "string") return 255;

            };

        if (!schemaField.fixedBytes)
            schemaField.fixedBytes = function () {

                if (schemaField.type === "number")
                    if ( this.checkValue( schemaField.maxSize, "maxSize") <= 255) return 1;

                if (schemaField.type === "buffer" || schemaField.type === "array" || schemaField.type === "string") {
                    const minSize = this.checkValue(schemaField.minSize, "minSize");
                    if ( minSize === this.checkValue(schemaField.maxSize, "maxSize")) return minSize;
                }

            };

        if (!schemaField.specifyLength)
            schemaField.specifyLength = function () {

                const fixedBytes = this.checkValue(schemaField.fixedBytes, "fixedBytes");
                if (fixedBytes) return false;

                const maxSize = this.checkValue(schemaField.maxSize, "maxSize");

                if (schemaField.type === "number") return Math.ceil(Math.log2( maxSize ) / 8);

                if (schemaField.type === "buffer" || schemaField.type === "array" || schemaField.type === "string") {
                    if ( this.checkValue(schemaField.minSize, "minSize") !== maxSize) return Math.ceil(Math.log2( maxSize) / 8);
                    if ( this.checkValue(schemaField.emptyAllowed, "emptyAllowed") && maxSize) return Math.ceil(Math.log2( maxSize ) / 8);
                }

            };

        if (!schemaField.emptyAllowed)
            schemaField.emptyAllowed = function () {

                if (schemaField.type === "buffer" || schemaField.type === "array" || schemaField.type === "string")
                    if (this.checkValue( schemaField.minSize, "minSize") === 0 && this.checkValue( schemaField.maxSize, "maxSize") === 0) return true;

            };

        //mapping default values
        if (!schemaField.default) {

            //maybe min Size
            const minSize = MarshalHelper.checkValue.call( this, schemaField.minSize, "minSize" );
            schemaField.default = defaultValues[schemaField.type].call(this, minSize);
        }

    }


    checkValue(...args){
        return MarshalHelper.checkValue.call(this, ...args);
    }

    checkProperty(propertyName, fieldName ){

        const value = this._schema.fields[fieldName][propertyName];
        if (typeof value === "function") return value.call(this, fieldName);
        else return value;

    }

    /**
     * Hashing
     */

    _marshalForHashing(marshalOptions = {}){

        if (!marshalOptions.skipMarshalForHashing) marshalOptions.skipMarshalForHashing = true;
        return this.toBuffer((obj, marshalOptions) => obj.hash(true, marshalOptions), marshalOptions);

    }

    hash(checkEnabled = false, marshalOptions = {}){

        if (checkEnabled && !this._schema.options.hashing.enabled) return Buffer.alloc(32);

        const returnSpecificHash = MarshalHelper.checkValue.call( this, this._schema.options.hashing.returnSpecificHash, "returnField");
        if ( returnSpecificHash ) return returnSpecificHash;

        if ( !marshalOptions.onlyFields && this.__data.__hash) return this.__data.__hash;

        const fct = this._schema.options.hashing.fct;

        const b = this._marshalForHashing(marshalOptions);

        const hash = fct ? fct( b ) : b;

        if (!marshalOptions.onlyFields) this.__data.__hash = hash;

        return hash;

    }

    hashEquals(hash){
        return this.hash().equals(hash);
    }

    hashCompare(hash){
        return this.hash().compare(hash);
    }


    _propagateHashingChanges() {

        if (this._schema.options.hashing.enabled) //TODO: if hash already deleted, it just return
            this.__data.__hash = undefined;

        if (this._schema.options.hashing.parentHashingPropagation && this._scope.parent)
            this._scope.parent._propagateHashingChanges();

        if (this.onHashChanged) this.onHashChanged.call(this );

    }

    _propagateChanges(){

        if (!this._scope.parent) return; //TODO: if hash already deleted, it just return

        if (!this._scope.parentFieldName)
            console.log("parentFieldName was not assigned", this);

        this._scope.parent.__changes[this._scope.parentFieldName] = true;

        this._scope.parent._propagateChanges();

    }

    size(){


        const marshal = this.toBuffer();
        const size = marshal.length;

        return size;

    }

    sizeInKB(){
       return this.size() / 1024;
    }

}
