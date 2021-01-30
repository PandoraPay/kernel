const {BufferDBSchemaBuilt} = require("../../../../src/db/db-generic/schemas/samples/buffer-db-schema-build");
const DBSchemaBuild = require("../../../../src/db/db-generic/schemas/db-schema-build")

const testSimple2Schema = {

    _testCreate: true,

    fields: {
        field0:{
            type: "buffer",
            default() {
                return Buffer.from("0000000000000000000004200004200004200000000000000000000000000000", "hex");
            },

            fixedBytes: 32,
            removeLeadingZeros: true,
        },
        field1:{
            type: "buffer",
            default() {
                return Buffer.from("0000000000000000000004200004200004200000000000000000000000000000", "hex");
            },

            fixedBytes: 32,
            removeLeadingZeros: false,
        },

        field2:{
            type: "object",
            schemaBuiltClass: BufferDBSchemaBuilt,
            default() {
                return this._createModelObject(  {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2");
            },
        },
    },
    saving: {
        storeDataNotId: true,
    }
}

const testAdvancedSchema = {

    fields:{

        field0: {
            type: "buffer",
            fixedBytes: 32,
            default: Buffer.from("0000000000000000000000AAFF00000000000000000000000000000000000000", "hex"),
        },
        field1: {
            type: "object",
            schemaBuiltClass: BufferDBSchemaBuilt,
            default() {
                return this._createModelObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field1");
            },
        },
        field2: {
            type: "array",
            schemaBuiltClass: BufferDBSchemaBuilt,
            default() {
                return [
                    this._createModelObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                    this._createModelObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                    this._createModelObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                ]
            },
        },
        field3:{
            type: "array",
            schemaBuiltClass: new DBSchemaBuild(testSimple2Schema),
            default() {
                return [
                    this._createModelObject( {field0: "0000000000000000000000AAFF00000000000000000000000000000000000000", field1: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field3"),
                    this._createModelObject( {field0: "0000000000000000000000AAFF00000000000000000000000000000000000000", field1: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field3"),
                ]
            },
        },
    },

    json: {
        field0: "0000000000000000000000aaff",
        field1: "0000000000000000000000aaff",
        field2: [
            "0000000000000000000000aaff",
            "0000000000000000000000aaff",
            "0000000000000000000000aaff",
        ],
        field3:[{
            field0: "0aaaff",
            field1: "0000000000000000000000aaff",
            field2: "0000000000000000000000aaff",
        },
            {
                field0: "0aaaff",
                field1: "0000000000000000000000aaff",
                field2: "0000000000000000000000aaff",
            },
        ]
    },

    output: [
        //TODO
    ],
}


const testSimpleUnique = {

    fields: {

        field0: {

            type: "string",
            default: "HclassSchemaELLO WORLD",

            unique: true,

        },

    },

    saving: {
        enabled: true,
    }

};

module.exports = {

    testSimpleUnique,
    testAdvancedSchema,

}