const SchemaBuild = require('../../marshal/schemas/schema-build')
const Helper = require('../../helpers/helper')
const MarshalData  = require( "./../../marshal/data/marshal-data")

class DBSchemaBuild extends SchemaBuild {

    constructor(schema = {}) {

        super( Helper.merge( {

            fields: {
                table: {
                    type: "string",
                    default: "obj",
                    fixedBytes: 3,
                    skipMarshal: true,
                    skipSaving: true,
                    skipHashing: true,
                    presetDisabled: true,
                    position: 10000,
                },
                id: {
                    type: "string",
                    default(schemaField) {
                        const fixedBytes = this.checkValue( schemaField.fixedBytes, "fixedBytes");
                        if (fixedBytes !== undefined) return MarshalData.makeId( fixedBytes );

                        const maxSize = this.checkValue( schemaField.maxSize, "maxSize");
                        return MarshalData.makeId( maxSize );
                    },
                    fixedBytes: 20,
                    skipMarshal: true,
                    skipSaving: true,
                    skipHashing: true,
                    presetDisabled: true,
                    unique: true,
                    position: 10002,
                }
            },

        },schema, true));

        this.saving = Helper.merge(  {
            enabled: true,
            indexable: false,
            indexableById: true,

            //type: undefined,

            saveInfixParentTable: true,

            //skipSavingAsItWasNotLoaded: false,

            //todo
            //storeDataNotId: false,
        }, schema.saving || {}, true);
    }

    get getClass(){
        return DBSchemaBuild;
    }

    postProcessSchema() {
        super.postProcessSchema();

        this.fieldsWithUniques = {}; this.fieldsWithUniquesLength = 0;

        for (const key in this.fields)
            if (this.fields[key].unique){
                this.fieldsWithUniques[key] = this.fields[key].unique;
                this.fieldsWithUniquesLength++;
            }

    }

}

module.exports = DBSchemaBuild;