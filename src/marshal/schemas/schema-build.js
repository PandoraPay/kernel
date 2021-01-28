const BN = require('../../../node_modules/bn.js/lib/bn')

const MarshalHelper = require( "../helpers/marshal-helper");
const Helper = require( "../../helpers/helper");
const MarshalValidation = require( "../fields/marshal-validation");
const MarshalValidationPreProcessing = require( "../fields/marshal-validation-pre-processing");
const MarshalValidationPreSet = require( "../fields/marshal-validation-pre-set");
const MarshalFields = require( "../fields/marshal-fields");
const UnmarshalFields = require( "../fields/unmarshal-fields");

const defaultValues = {

    number: minSize => minSize,
    bigNumber: minSize => new BN( minSize ),
    string:  minSize => Array( minSize + 1 ).join('X') ,
    buffer:  minSize => Buffer.alloc( minSize ),
    array:  () =>[] ,
    boolean: () => false,
    object: () => undefined,

};

class SchemaBuild {

    constructor( schema = {} ) {

        this.fields = Helper.merge(  {}, schema.fields || {}, true);
        this.options = Helper.merge(  {

            hashing:{
                //enabled: false
                //parentHashingPropagation: false
                //fct: keccak
                //returnSpecificHash: undefined
            },

            //returnOnlyField
        }, schema.options || {}, true);

        this._initializeSchema();
    }

    _initializeSchema(){
        this.postProcessSchema();
        this.initializedSchema = true;
    }

    postProcessSchema() {

        let position = 0, fields = [];

        for (const field in this.fields) {

            if (!this.fields[field]){
                delete this.fields[field];
                continue;
            }

            if (this.fields[field].position === undefined)
                this.fields[field].position = position++;

            if ( position < this.fields[field].position )
                position = this.fields[field].position;

            fields.push(field);

        }

        fields.sort ( (a,b) => this.fields[a].position - this.fields[b].position );

        this.fieldsSorted = fields;

        for (const field of fields){

            const schemaField = this.fields[field];

            schemaField._validateSchemaField = MarshalValidation[`validate_${schemaField.type}`];
            schemaField._validatePreprocessingSchemaField = MarshalValidationPreProcessing[`preprocessing_${schemaField.type}`];

            if (MarshalValidationPreSet[`preset_${schemaField.type}`])
                schemaField._validatePresetSchemaField = MarshalValidationPreSet[`preset_${schemaField.type}`];

            schemaField._marshalSchemaField = MarshalFields[`marshal_${schemaField.type}`];
            schemaField._marshalSchemaFieldToBuffer = MarshalFields[`marshal_${schemaField.type}_toBuffer`];

            schemaField._unmarshalSchemaField = UnmarshalFields[`unmarshal_${schemaField.type}`];
            schemaField._unmarshalSchemaFieldFromBuffer = UnmarshalFields[`unmarshal_${schemaField.type}_fromBuffer`];

            this._fillDefaultValues(field, schemaField);

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

                if (schemaField.type === "string") return true; //strings are utf-8 so it will be variable based on the characters stored...

                const fixedBytes = this.checkValue(schemaField.fixedBytes, "fixedBytes");
                if (fixedBytes) return false;

                return true;

            };

        if (!schemaField.emptyAllowed)
            schemaField.emptyAllowed = function () {

                if (schemaField.type === "buffer" || schemaField.type === "array" || schemaField.type === "string")
                    if (this.checkValue( schemaField.minSize, "minSize") === 0 && this.checkValue( schemaField.maxSize, "maxSize") === 0) return true;

            };

        //mapping default values
        if (!schemaField.default) {

            //maybe min Size
            const minSize = this.checkValue( schemaField.minSize, "minSize" );
            schemaField.default = defaultValues[schemaField.type].call(this, minSize);
        }

    }

    checkValue(...args){
        return MarshalHelper.checkValue.call(this, ...args);
    }

}

module.exports = SchemaBuild