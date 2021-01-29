const Exception = require( "../helpers/exception");
const Helper = require( "../helpers/helper");

const ModelBase = require( "./model-base");

const MarshalHelper = require( "./helpers/marshal-helper");
const SchemaBuild = require('./schemas/schema-build')

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


class Model extends ModelBase {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, schema, data, creationOptions);
        this._createSchema(data, type, creationOptions);

    }

    _createSchema(data, type, creationOptions = {}) {

        if (!this._schema.fields) throw "schema.fields is not defined";

        if (this._scope.parent)
            if ( creationOptions.skipPropagatingHashing ) {
                this._schema.options.hashing.enabled = false;
                this._schema.options.hashing.parentHashingPropagation = false;
            }

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



    _defineField(field, schemaField, dataValue, dataType, creationOptions) {

        const creationReplaceFields = creationOptions.replaceFields;
        const creationEmptyObject = creationOptions.emptyObject;

        const self = this;
        Object.defineProperty(self, field, {

            get: schemaField.getter ? schemaField.getter.bind(self, field) : function () {

                return self.__data[field];

            },
            set: function (new_value, validateEnabled=true, defineField) {

                new_value = schemaField._validatePreprocessingSchemaField.call( this, new_value, schemaField);

                if (schemaField._validatePresetSchemaField)
                    new_value = schemaField._validatePresetSchemaField.call(this, new_value, schemaField);

                if (schemaField.preprocessor)
                    new_value = schemaField.preprocessor.call(self, new_value, field );

                //check if the values are actually different
                if (defineField) ;
                else
                if (schemaField.type === "buffer"){
                    if (self.__data[field].equals(new_value)) return;
                } else
                if (schemaField.type === "array"){

                    if (self.__data[field].length === new_value.length ) {
                        let change = false;
                        for (let i = 0; i < new_value.length; i++)
                            if (self.__data[field][i] !== new_value[i]) {
                                change = true;
                                break;
                            }

                        if (!change) return;
                    }
                }
                else if (self.__data[field] === new_value) return;

                if (validateEnabled && !creationOptions.skipValidation)
                    self._validateField.call(self, field, new_value, schemaField);

                self.__data[field] = new_value;

                self.__changes[field] = true;
                self.__data.modified = new Date().getTime();

                if (schemaField.ifNonDefault !== undefined)
                    self.__default[field] = false;

                if (schemaField.setEvent)
                    schemaField.setEvent.call(self, new_value, validateEnabled );

                if (!defineField && !MarshalHelper.checkValue.call( this, schemaField.skipHashing, field)  ){

                    /**
                     * Hash should be different now as data was changed
                     */

                    if (this._schema.options.hashing.enabled) self.__data.__hash = undefined;
                    if (this._schema.options.hashing.parentHashingPropagation) this._propagateHashingChanges();

                }

                this._propagateChanges();

            }

        });


        if (dataType === "object"  && dataValue !== undefined ) {

            let fieldName = field;
            if (creationReplaceFields && creationReplaceFields[ field ] ){
                fieldName = creationReplaceFields[ field ];
                if (typeof fieldName === "object") fieldName = fieldName._name || field;
            }

            dataValue = dataValue[fieldName];
        }


        if (!(dataValue instanceof Model)){


            if (dataType === "buffer" && dataValue !== undefined && this.checkProperty( "skipMarshal", field) )
                dataValue = undefined;

            if ( schemaField.ifNonDefault !== undefined && dataType === "buffer"  ){
                if (dataValue.lastByte() !== schemaField.ifNonDefault) dataValue = undefined;
                else dataValue.read1Byte();
            }

            if (dataValue !== undefined && !this.checkProperty( "skipMarshal", field )  ) {

                dataValue = schemaField._validatePreprocessingSchemaField.call( this, dataValue, schemaField);

                //avoid processing values ( used in constructor )
                if (!creationOptions.skipProcessingConstructionValues) {
                    const fct = dataType === "buffer" ? '_unmarshalSchemaFieldFromBuffer' : '_unmarshalSchemaField';
                    dataValue = schemaField[fct].call(this, dataValue, schemaField, field, dataType, undefined, this._createModelObject.bind(this), MarshalHelper.constructOptionsCreation(creationOptions, field));
                }

            }

        }


        // in case dataValue was not specified
        let isDefault = false;
        if (dataValue === undefined || ( this._schema.options.returnOnlyField && this._schema.options.returnOnlyField !== field ) ) {

            dataValue = schemaField.default;
            if (typeof dataValue === "function") dataValue = dataValue.call(this, schemaField);

            if (dataValue === undefined && schemaField.type === "object" && !this.checkValue(schemaField.emptyAllowed, "emptyAllowed"))
                    dataValue = this._createModelObject({}, "object", field, schemaField, undefined, 0, MarshalHelper.constructOptionsCreation(creationOptions, field));

            isDefault = true;
        }

        this._validateFieldCreation(field, dataValue, schemaField);


        //set value
        Object.getOwnPropertyDescriptor(this, field).set.call( this, dataValue, !creationEmptyObject, true );

        if (isDefault && schemaField.ifNonDefault !== undefined)
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

        let marshal = isObject ? {} : [], schemaField;

        const marshalOnlyFields = marshalOptions.onlyFields;
        const marshalReplaceFields = marshalOptions.replaceFields;


        const fct = isObject ? '_marshalSchemaField' : '_marshalSchemaFieldToBuffer';

        const fields = this._schema.options.returnOnlyField ? [this._schema.options.returnOnlyField] : this._schema.fieldsSorted;

        let i = 0;
        for (const field of fields )
            if (!marshalOnlyFields || marshalOnlyFields[field]) {

                if ( marshalOptions.skipMarshalForHashing && this.checkProperty( "skipHashing", field )) continue;
                if ( marshalOptions.saving && this.checkProperty( "skipSaving", field )) continue;
                if ( !marshalOptions.saving && this.checkProperty( "skipMarshal", field )) continue;

                schemaField = this._schema.fields[field];

                if ( schemaField.ifNonDefault !== undefined)
                    if (this.__default[field]) continue;
                    else
                    if ( !isObject ){
                        marshal[i] = Buffer.alloc(1);
                        marshal[i][0] = schemaField.ifNonDefault;
                        i++;
                    }

                marshal[ isObject ? field : i ] = this._schema.fields[field][fct].call(this, this[field], schemaField, text, callbackObject, type, MarshalHelper.constructOptionsMarshaling( marshalOptions, field) );
                i++;

            }

        if (marshalReplaceFields && isObject ){

            const newMarshal = {};

            for (const field in marshal){

                let fieldName = marshalReplaceFields[ field ];
                if (typeof fieldName === "object") fieldName = fieldName._name || field;

                newMarshal[ fieldName ? fieldName : field ] = marshal[field];
            }

            marshal = newMarshal;
        }


        if (!isObject) return Buffer.concat(marshal);
        else if (isObject) {

            if (this._schema.options.returnOnlyField) return marshal[this._schema.options.returnOnlyField];
            else return marshal;

        }

    }



    unmarshal( input, type = "buffer", callbackObject, unmarshalOptions = {} ) {

        let schemaField, data, field, saving;

        const isObject = type !== "buffer";

        const unmarshalOnlyFields = unmarshalOptions.onlyFields;
        const unmarshalReplaceFields = unmarshalOptions.replaceFields;

        const fct = isObject ?  '_unmarshalSchemaField' :'_unmarshalSchemaFieldFromBuffer';

        const fields =  this._schema.options.returnOnlyField ? [this._schema.options.returnOnlyField] : this._schema.fieldsSorted;

        for ( field of fields)
            if ( !unmarshalOnlyFields || unmarshalOnlyFields[field] ) {

                if ( unmarshalOptions.loading && this.checkProperty( "skipSaving", field )) continue;
                if ( !unmarshalOptions.loading && this.checkProperty( "skipMarshal", field )) continue;

                schemaField = this._schema.fields[field];

                let fieldName = field;
                if (unmarshalReplaceFields && unmarshalReplaceFields[ field ] && isObject){
                    fieldName = unmarshalReplaceFields[ field ];
                    if (typeof fieldName === "object") fieldName = fieldName._name || field;
                }

                if (unmarshalOptions.isFieldSkipped )
                    if (!unmarshalOptions.isFieldSkipped.call(this, fieldName, schemaField )) continue;

                if ( schemaField.ifNonDefault !== undefined )
                    if ( !isObject ){

                        if (input.lastByte() !== schemaField.ifNonDefault) continue;
                        else input.read1Byte();

                    } else
                        if (input[fieldName] === undefined) continue;

                data =  schemaField[fct].call( this, schemaField._validatePreprocessingSchemaField.call( this, isObject && typeof input === "object" ? input[ fieldName ] : input, schemaField  ) , schemaField, field, type, callbackObject, this._createModelObject.bind(this), MarshalHelper.constructOptionsUnmarshaling(unmarshalOptions, field)  );

                Object.getOwnPropertyDescriptor(this, field).set.call( this, data, !unmarshalOptions.emptyObject, false );

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

        Object.getOwnPropertyDescriptor(this, fieldName).set.call( this, array, true );

        return element;

    }

    removeArray(fieldName, position){

        if (position < 0 || position > this[fieldName].length ) throw new Exception(this, "Position is invalid to be removed");

        const array = [... this[fieldName] ];
        array.splice( position, 1 );

        Object.getOwnPropertyDescriptor(this, fieldName).set.call( this, array, true );


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

        if ( !this._schema.options.hashing.enabled || this.checkProperty("skipHashing", fieldName  )) unmarshalOptions.skipPropagatingHashing = true;

        if (!schemaBuiltField) schemaBuiltField = this._schema.fields[fieldName];
        let schemaBuiltClass = schemaBuiltField.schemaBuiltClass;
        if ( typeof schemaBuiltClass === "function" && !schemaBuiltClass.prototype ) //if it is a callback
            schemaBuiltClass = schemaBuiltClass.call(this, data, fieldName, schemaBuiltField);

        let modelClass = schemaBuiltField.modelClass;
        if ( typeof modelClass === "function" && !modelClass.prototype ) //if it is a callback
            modelClass = modelClass.call(this, data, fieldName, schemaBuiltField);

        let loadingId = false;
        if (data !== undefined && typeof data === "string" && callbackObject) {
            loadingId = true;
            unmarshalOptions.emptyObject = true;
        }


        const object = this._creationMiddleware( modelClass, {
                ...this._scope,
                parentFieldName: fieldName,
                parent: this,
                parentIndex: parentIndex,
            },
            schemaBuiltClass,
            loadingId ? undefined : data,
            loadingId ? undefined : type,
            unmarshalOptions);

        if (loadingId && schemaBuiltClass)
            callbackObject(object, unmarshalOptions, data, type );

        return object;

    }

    _creationMiddleware( modelClass = this.getModelClass, scope, schemaBuiltClass, data, type, unmarshalOptions){
        if (!schemaBuiltClass) return;
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