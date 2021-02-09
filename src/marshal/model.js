const Exception = require( "../helpers/exception");
const Helper = require( "../helpers/helper");

const ModelBase = require( "./model-base");

const MarshalHelper = require( "./helpers/marshal-helper");

/**
 *
 * Model Class enables automatic serialization/deserialization of the application's data.
 * Blocks and Data needs to be serialized to Raw Data (Buffer) and JSON(Object, and String)
 *
 * Invalid fields must throw errors
 *
 * scope:
 *          argv, logger, db
 *
 */

const defaultValues = {

    number: minSize => minSize,
    bigNumber: minSize => new BN( minSize ),
    string:  minSize => Array( minSize + 1 ).join('X') ,
    buffer:  minSize => Buffer.alloc( minSize ),
    array:  () =>[] ,
    boolean: () => false,
    object: () => undefined,

};


class Model extends ModelBase {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, schema, data, creationOptions);
        this._createSchema(data, type, creationOptions);

    }

    _createSchema(data, type, creationOptions = {}) {

        if (!this._schema.fields) throw "schema.fields is not defined";

        if (data && !this._schema.options.returnOnlyField)  {
            const out = this._convertDataType(data, undefined);
            data = out.data;
            type = out.type;
        }

        /**
         * In case, schema returns only one field
         */

        if (type === "object" && this._schema.options.returnOnlyField && (typeof data !== "object" ||  !data[this._schema.options.returnOnlyField] ) ) {
            const newData = {};
            newData [this._schema.options.returnOnlyField] = data;
            data = newData;
        }

        /**
         * Create all fields
         */

        const creationOnlyFields = creationOptions.onlyFields;

        for (const field of this._schema.fieldsSorted )
            if (!creationOnlyFields || creationOnlyFields[field])
                this._defineField(field, this._schema.fields[field], data, type, creationOptions );

        return true;
    }


    _get(field){
        return this.__data[field];
    }

    _set(field, schemaField, new_value, checkIfValuesAreIdentical, validateEnabled = true, propagateChanges = true ){

        new_value = schemaField._validatePreprocessingSchemaField.call( this, new_value);

        if (schemaField._validatePresetSchemaField)
            new_value = schemaField._validatePresetSchemaField.call(this, new_value, schemaField);

        if (schemaField.preprocessor)
            new_value = schemaField.preprocessor.call(this, new_value, field );

        //check if the values are actually different
        if (checkIfValuesAreIdentical) {
            if (schemaField.type === "buffer") {
                if (this.__data[field].equals(new_value)) return;
            } else if (schemaField.type === "array") {

                if (this.__data[field].length === new_value.length) {
                    let change = false;
                    for (let i = 0; i < new_value.length; i++)
                        if (this.__data[field][i] !== new_value[i]) {
                            change = true;
                            break;
                        }

                    if (!change) return;
                }
            } else if (this.__data[field] === new_value) return;
        }

        if (validateEnabled)
            this._validateField.call(this, field, new_value, schemaField);

        this.__data[field] = new_value;

        this.__data.modified = new Date().getTime();

        if (schemaField.setEvent)
            schemaField.setEvent.call(this, new_value, validateEnabled );

        if (propagateChanges){
            // Hash should be different now as data was changed
            this._propagateHashingChanges(field);
            this._propagateChanges(field);
        } else {
            this.__changes[field] = true;
        }

    }

    _defineField(field, schemaField, dataValue, dataType, creationOptions) {


        const self = this;
        Object.defineProperty(self, field, {

            get: schemaField.getter ? schemaField.getter.bind(self, field, schemaField) : this._get.bind(self, field, schemaField),
            set: this._set.bind(self, field, schemaField ),

        });

        if (dataType === "object" && dataValue )
            dataValue = dataValue[field];

        if ( this.checkProperty( "skipMarshal", field) )
            dataValue = undefined;

        if ( dataValue !== undefined && !(dataValue instanceof Model) ){

            dataValue = schemaField._validatePreprocessingSchemaField.call( this, dataValue );

            //avoid processindataValueg values ( used in constructor )
            if (!creationOptions.skipProcessingConstructionValues) {
                const fct = dataType === "buffer" ? '_unmarshalSchemaFieldFromBuffer' : '_unmarshalSchemaField';
                dataValue = schemaField[fct].call(this, dataValue, schemaField, field, dataType, undefined, this._createModelObject.bind(this), MarshalHelper.constructOptionsCreation(creationOptions, field));
            }

        }

        // in case dataValue was not specified
        let isDefault = false;
        if (dataValue === undefined || ( this._schema.options.returnOnlyField && this._schema.options.returnOnlyField !== field ) ) {

            dataValue = schemaField.default;
            if (dataValue === undefined){
                //maybe min Size
                const minSize = this.checkValue( schemaField.minSize, "minSize" );
                dataValue = defaultValues[schemaField.type].call( undefined, minSize);
            }

            if (typeof dataValue === "function") dataValue = dataValue.call(this, schemaField);
            else if ( !dataValue && schemaField.type === "object" && !this.checkValue(schemaField.emptyAllowed, "emptyAllowed"))
                dataValue = this._createModelObject({}, "object", field, schemaField, undefined, 0, MarshalHelper.constructOptionsCreation(creationOptions, field));

            isDefault = true;
        }

        this._validateFieldCreation(field, dataValue, schemaField);


        //set value
        Object.getOwnPropertyDescriptor(this, field).set.call( this, dataValue, false, !creationOptions.loading, !creationOptions.loading );

        if (isDefault)
            this.__default[field] = true;

        this.__data.__fields++;

    }




    /**
     * This will validate the object. In case there is a problem, it will throw error messages
     */
    validate() {

        for (const field of this._schema.fieldsSorted)
            this._validateField(field, this[field], this._schema.fields[field]);

        return true;

    }

    /**
     * validate a specific field
     * @param name of the field
     * @param value - specify a value, or leave it undefined and it will use the field's value
     * @param schemaField
     */
    _validateField(name, value, schemaField) {

        schemaField._validateSchemaField.call(this, value, schemaField);

        //additional validation
        if (typeof schemaField.validation === "function")
            if (!schemaField.validation.call(this, value, name, schemaField))
                throw new Exception("Additional Validation was not passed", {name});

        return true;
    }

    _marshal(type, text = true, callbackObject, marshalOptions = {}) {

        const isObject = (type !== "buffer");
        const marshal = isObject ? {} : [];
        const marshalOnlyFields = marshalOptions.onlyFields;

        const fct = isObject ? '_marshalSchemaField' : '_marshalSchemaFieldToBuffer';

        const fields = this._schema.options.returnOnlyField ? [this._schema.options.returnOnlyField] : this._schema.fieldsSorted;

        let i = 0;
        for (const field of fields )
            if (!marshalOnlyFields || marshalOnlyFields[field]) {

                if ( marshalOptions.skipMarshalForHashing && this.checkProperty( "skipHashing", field )) continue;
                if ( marshalOptions.saving && this.checkProperty( "skipSaving", field )) continue;
                if ( !marshalOptions.saving && this.checkProperty( "skipMarshal", field )) continue;

                const schemaField = this._schema.fields[field];

                marshal[ isObject ? field : i ] = this._schema.fields[field][fct].call(this, this[field], schemaField, text, callbackObject, type, MarshalHelper.constructOptionsMarshaling( marshalOptions, field) );
                i++;

            }

        if (!isObject) return Buffer.concat(marshal);
        else if (isObject) {

            if (this._schema.options.returnOnlyField) return marshal[this._schema.options.returnOnlyField];
            else return marshal;

        }

    }



    unmarshal( input, type = "buffer", callbackObject, unmarshalOptions = {} ) {

        const isObject = type !== "buffer";

        const unmarshalOnlyFields = unmarshalOptions.onlyFields;

        const fct = isObject ?  '_unmarshalSchemaField' :'_unmarshalSchemaFieldFromBuffer';

        const fields =  this._schema.options.returnOnlyField ? [this._schema.options.returnOnlyField] : this._schema.fieldsSorted;

        for ( const field of fields)
            if ( !unmarshalOnlyFields || unmarshalOnlyFields[field] ) {

                if ( unmarshalOptions.loading && this.checkProperty( "skipSaving", field )) continue;
                if ( !unmarshalOptions.loading && this.checkProperty( "skipMarshal", field )) continue;

                const schemaField = this._schema.fields[field];

                if (unmarshalOptions.isFieldSkipped )
                    if (!unmarshalOptions.isFieldSkipped.call(this, field, schemaField )) continue;

                const data =  schemaField[fct].call( this, schemaField._validatePreprocessingSchemaField.call( this, isObject && typeof input === "object" ? input[ field ] : input  ) , schemaField, field, type, callbackObject, this._createModelObject.bind(this), MarshalHelper.constructOptionsUnmarshaling(unmarshalOptions, field)  );

                Object.getOwnPropertyDescriptor(this, field).set.call( this, data, false, !unmarshalOptions.loading, false );

            }


        return this;
    }

    pushArray( fieldName, data, type , unmarshalOptions, position){

        const schemaField = this._schema.fields[fieldName];
        if ( !fieldName || !schemaField) throw new Exception( this, "Field is not defined");
        if ( schemaField.type !== "array" ) throw new Exception( this, "Field is not an array");

        const parentIndex = (position === undefined) ? this[fieldName].length-1 : position;

        const element = data instanceof Model ? data : this._createModelObject( data, type, fieldName, schemaField,  undefined, parentIndex, unmarshalOptions );

        const array = [... this[fieldName] ];

        if (position === undefined) array.push(element); //to trigger the changes
        else array.splice( position, 0, element );

        for (let i=position; i < array.length; i++)
            array[i].parentIndex = i;

        Object.getOwnPropertyDescriptor(this, fieldName).set.call( this, array, false, true, true );

        return element;

    }

    removeArray(fieldName, position){

        if (position < 0 || position > this[fieldName].length ) throw new Exception(this, "Position is invalid to be removed");

        const array = [... this[fieldName] ];
        array.splice( position, 1 );

        Object.getOwnPropertyDescriptor(this, fieldName).set.call( this, array, false, true, true );

        for (let i=position; i < array.length; i++)
            array[i].parentIndex = i;

    }

    _createSimpleModelObject( modelClass, schemaBuiltClass, fieldName, data, type, parentIndex, unmarshalOptions = {}  ){

        const object = this._creationMiddleware( modelClass, {
                ...this._scope,
                parentFieldName: fieldName,
                parent: this,
                parentIndex: parentIndex,
            },
            schemaBuiltClass,
            data,
            type,
            unmarshalOptions);

        return object;

    }

    _createModelObject( data, type, fieldName, schemaBuiltField, callbackObject, parentIndex, unmarshalOptions = {} ) {

        if (!schemaBuiltField) schemaBuiltField = this._schema.fields[fieldName];
        let schemaBuiltClass = schemaBuiltField.schemaBuiltClass;
        if ( typeof schemaBuiltClass === "function" && !schemaBuiltClass.prototype ) //if it is a callback
            schemaBuiltClass = schemaBuiltClass.call(this, data, fieldName, schemaBuiltField);

        let modelClass = schemaBuiltField.modelClass;
        if ( typeof modelClass === "function" && !modelClass.prototype ) //if it is a callback
            modelClass = modelClass.call(this, data, fieldName, schemaBuiltField);

        const isLoadingId = unmarshalOptions.loading && callbackObject;

        const object = this._creationMiddleware( modelClass, {
                ...this._scope,
                parentFieldName: fieldName,
                parent: this,
                parentIndex: parentIndex,
            },
            schemaBuiltClass,
            isLoadingId ? undefined : data,
            isLoadingId ? undefined : type,
            unmarshalOptions);

        if ( isLoadingId )
            callbackObject(object, unmarshalOptions, data, type );

        return object;

    }

    _creationMiddleware( modelClass, scope, schemaBuiltClass, data, type, unmarshalOptions){

        if (!schemaBuiltClass && !modelClass) return;
        if (!modelClass) modelClass = this.getModelClass;

        return new modelClass( scope, schemaBuiltClass, data, type, unmarshalOptions );
    }

    get getModelClass(){
        return Model;
    }

    isChanged(){

        for (const key in this.__changes)
            if (this.__changes[key])
                return true;

        return false;
    }

}

module.exports = Model;