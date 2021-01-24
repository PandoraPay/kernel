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

            emptyObject: options.emptyObject,
            skipProcessingConstructionValues: options.skipProcessingConstructionValues,

            skipPropagatingHashing: options.skipPropagatingHashing,
            
            skipValidation: options.skipValidation,

        }
    }

    _constructOptionsBase(options = {}, field){

        return {
            onlyFields: (options.onlyFields && typeof options.onlyFields[field]) === "object" ? options.onlyFields[field] : undefined,
            replaceFields: ( options.replaceFields && typeof options.replaceFields[field] === "object" ) ? options.replaceFields[field] : undefined,
            isFieldSkipped: options.isFieldSkipped,

        };

    }


    objectDelimiter(str, value, delimiter = '.'){

        const final = {};
        let obj = final;

        while (str.indexOf(".")>=0){

            let infix = str.substr(0, x.indexOf(delimiter));
            str = str.substr(str.indexOf(delimiter)+1);

            if ( !obj[infix] )
                obj[infix] = {};

            obj = obj[infix];
        }

        obj[str] = value;

        return final;
    }

}

module.exports = new MarshalHelper()