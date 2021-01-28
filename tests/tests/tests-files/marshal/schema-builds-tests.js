const {SchemaBuiltBuffer} = require("../../../../src/marshal/schemas/samples/schema-build-buffer");
const DBSchemaBuild = require("../../../../src/db/db-generic/db-schema-build")

const testSimple2Schema = {
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
            schemaBuiltClass: SchemaBuiltBuffer,
            default() {
                return this._createMarshalObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2");
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
            schemaBuiltClass: SchemaBuiltBuffer,
            default() {
                return this._createMarshalObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field1");
            },
        },
        field2: {
            type: "array",
            schemaBuiltClass: SchemaBuiltBuffer,
            default() {
                return [
                    this._createMarshalObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                    this._createMarshalObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                    this._createMarshalObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                ]
            },
        },
        field3:{
            type: "array",
            schemaBuiltClass: new DBSchemaBuild(testSimple2Schema),
            default() {
                return [
                    this._createMarshalObject( {field0: "0000000000000000000000AAFF00000000000000000000000000000000000000", field1: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field3"),
                    this._createMarshalObject( {field0: "0000000000000000000000AAFF00000000000000000000000000000000000000", field1: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field3"),
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
            default: "HELLO WORLD",

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