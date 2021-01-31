const BN = require( "bn.js");

const SchemaBuild = require('./schemas/schema-build')

const Base58 = require( "../helpers/base58-helper");
const StringHelper = require( "../helpers/string-helper");
const Exception = require( "../helpers/exception");
const BufferReader = require( "../helpers/buffers/buffer-reader");
const MarshalHelper = require( "./helpers/marshal-helper");

const defaultValuesExist = {number: true, string: true, array: true, boolean: true, buffer: true, object: true, bigNumber: true};

module.exports = class ModelBase {

    constructor(scope, schema, data, creationOptions = {}) {

        this._scope = {
            ...scope,
            ...creationOptions.scope||{},
        };

        this.__isModel = true;

        if (!schema || !(schema instanceof SchemaBuild) ) throw "schema is not defined or invalid";

        this._schema = schema;

        this.__data = {
            __fields: 0,

            __hash: undefined,
        };

        this.__default = { };
        
        this.__changes = { };

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
            throw "fromType raised an error. Type is not specified";

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

        if ( data === undefined) throw "fromType raised an error. Data is not specified";

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


        if (!schemaField) schemaField = this._schema.fields[name];

        if (!schemaField || typeof schemaField !== "object")
            throw "Schema was not found";

        //validate its type
        if (!schemaField.type || !defaultValuesExist[schemaField.type])
            throw "Type is invalid";

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

        const returnSpecificHash = this.checkValue(  this._schema.options.hashing.returnSpecificHash, "returnField");
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


    _propagateHashingChanges(field ) {

        if (this._schema.options.hashing.enabled){

            if (this._schema.fields[field]){
                if (this.checkValue(this._schema.fields[field].skipHashing, field ))
                    return;
            }

            if (!this.__data.__hash) return;
            this.__data.__hash = undefined;

            if (this._schema.options.hashing.parentHashingPropagation && this._scope.parent)
                this._scope.parent._propagateHashingChanges(this._scope.parentFieldName);

            if (this.onHashChanged) this.onHashChanged.call(this );
        }

    }

    _propagateChanges(field){

        if (this.__changes[field]) return;
        this.__changes[field] = true;

        if (this._scope.parent){

            if (!this._scope.parentFieldName) this._scope.logger.error(this, "parentFieldName was not assigned", {field} );
            this._scope.parent._propagateChanges(this._scope.parentFieldName);

        }

    }

    size(){


        const model = this.toBuffer();
        const size = model.length;

        return size;

    }

    sizeInKB(){
       return this.size() / 1024;
    }



}
