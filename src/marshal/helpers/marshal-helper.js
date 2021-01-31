class MarshalHelper{

    checkValue(value, fieldName){

        if (typeof value === "function") return value.call(this, fieldName);
        return value;

    }

    constructOptionsMarshaling(options = {}, field){
        return {
            ...this._constructOptionsBase(options, field),
            skipMarshalForHashing: options.skipMarshalForHashing,
            skipMarshalTrimming: options.skipMarshalTrimming,
            saving: options.saving,
        }

    }

    constructOptionsUnmarshaling(options = {}, field){
        return {
            ...this._constructOptionsBase(options, field),
            loading: options.loading,
        }
    }

    constructOptionsCreation(options = {}, field){
        return {
            ...this._constructOptionsBase(options, field),
            loading: options.loading,
        }
    }

    _constructOptionsBase(options = {}, field){

        return {
            onlyFields: (options.onlyFields && typeof options.onlyFields[field]) === "object" ? options.onlyFields[field] : undefined,
            isFieldSkipped: options.isFieldSkipped,
        };

    }

}

module.exports = new MarshalHelper()