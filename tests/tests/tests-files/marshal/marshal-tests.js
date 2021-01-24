const DBSchema = require.main.require("./src/db/db-generic/db-schema");
const DBSchemaBuffer = require.main.require("./src/db/db-generic/samples/db-schema-buffer");

const BN = require("bn.js")

class TestClass1 extends DBSchema{

    constructor(scope, schema={}, data, type, onlyFields, emptyObject){

        super(scope, {

            fields:{
                field0:{
                    type: "buffer",
                    default() {
                        return Buffer.from("0000000000000000000004200004200004200000000000000000000000000000", "hex");
                    },

                    fixedBytes: 32,
                    removeLeadingZeros: true,
                },

            },

            ...schema,

        }, data, type, onlyFields, emptyObject);

    }

}

class TestClassStoreData extends DBSchema{

    constructor(scope, schema={}, data, type, onlyFields, emptyObject){

        super(scope, {

            fields:{

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
                    classObject: DBSchemaBuffer,
                    default() {
                            return this._createSchemaObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2");
                    },
                },

            },

            saving:{
                storeDataNotId: true,
            },

            ...schema,

        }, data, type, onlyFields, emptyObject);

    }

}

const bufferTest = {

    fields: {

        field0: {
            type: "buffer",
            default: Buffer.from("0011223344", "hex"),
            fixedBytes: 5,
        },

        field1: {
            type: "buffer",
            default: Buffer.from("0000040200", "hex"),
            maxSize: 255,
            minSize: 0,

            removeLeadingZeros: true,
        },

        field2: {
            type: "buffer",
            default: Buffer.from("000099887766", "hex"),
            maxSize: 255,
            minSize: 0,

            removeLeadingZeros: false,
        },

        field3: {
            type: "buffer",
            default: Buffer.from("000099887766", "hex"),
            maxSize: 255,
            minSize: 0,

            removeLeadingZeros: true,
        },

        field4: {
            type: "buffer",
            default: Buffer.from("0000998877660000", "hex"),
            maxSize: 255,
            minSize: 0,

            removeLeadingZeros: true,
        },

        field5: {
            type: "buffer",
            default: Buffer.from("000000000000000000000063FF", "hex"),

            fixedBytes: 32,

            removeLeadingZeros: true,
        },

        field6: {
            type: "buffer",
            default: Buffer.from("000000000000000000000063FF00000000000000000000000000000000000000", "hex"),

            fixedBytes: 32,

            removeLeadingZeros: true,
            specifyLength: true,

        },

        field7: {
            type: "buffer",
            default: Buffer.from("0000000000000000000000AAFF00000000000000000000000000000000000000", "hex"),

            fixedBytes: 32,
        },

        field8: {
            type: "buffer",
            default: Buffer.from("0000000000000000000000000000000000000000000100000000000000000000", "hex"),

            fixedBytes: 32,
            specifyLength: true,
        },

        field9: {
            type: "buffer",
            default: Buffer.from("0000000000000000000000000020000000000000000000000000000000000000", "hex"),

            fixedBytes: 32,
            removeLeadingZeros: true,
            specifyLength: true,
        },

    },

    saving: {
        enabled: true,
    },
}

class TestClassBuffer extends DBSchema{

    constructor(scope, schema={}, data, type, onlyFields, emptyObject){

        super(scope, {

            ...bufferTest,

            ...schema,

        }, data, type, onlyFields, emptyObject);

    }

}



module.exports = {

    TestClass1: TestClass1,

    schemaSimple: {

        fields: {

            field0: {
                type: "boolean",
                default: true,
            },

            field1: {
                type: "number",
                default: 420,
                fixedBytes: 2,
            },

            field2:{
                type: "string",
                default: "ROOM_237",
                maxSize: 255,
            },

            field3:{

                type: "array",
                default: [],
                minSize: 0,
                maxSize: 100,

            },

            field4: {

                type: "buffer",
                default (){
                    return Buffer.from("0011223344", "hex")
                },
                fixedBytes: 5,
            },

            field5: {
                type: "bigNumber",
                default (){
                    return new BN("3291738291732918372198371289372198372198372198732189737219837219", 10)
                },
            },

            field6: {
                type: "bigNumber",
                default: new BN(1),
            }

        },

        saving: {
            enabled: true,
        },

        output:[
            true,
            420,
            "ROOM_237",
            [],
            Buffer.from("0011223344", "hex"),
            new BN("3291738291732918372198371289372198372198372198732189737219837219", 10),
            new BN(1),
        ],

    },


    bufferTestsSchema:{

        schema: TestClassBuffer,

        ...bufferTest,


        data: [
            "0011223344",
            "0000040200",
            "000099887766",
            "000099887766",
            "0000998877660000",
            "000000000000000000000063FF00000000000000000000000000000000000000",
            "000000000000000000000063FF00000000000000000000000000000000000000",
            "0000000000000000000000AAFF00000000000000000000000000000000000000",
            "0000000000000000000000000000000000000000000100000000000000000000",
            "0000000000000000000000000020000000000000000000000000000000000000",
        ],

        json: [
            "0011223344",
            "02040200", //removing leading zeros buffer
            "000099887766", //
            "0299887766",  //removing leading zero buffer
            "02998877660000",  //including length
            "0b63ff",  //including the rest of zeros
            "0b63ff",  //length is not included in json
            "0000000000000000000000AAFF",
            "00000000000000000000000000000000000000000001",  //including length
            "0D20",  //including length
        ],

        output: [
            "0011223344",
            "0203040200", //length and removing leading zeros buffer
            "06000099887766", //including length
            "020499887766",  //including length
            "0206998877660000",  //including length
            "0b63ff00000000000000000000000000000000000000",  //including the rest of zeros
            "0b0263ff",  //including length
            "0000000000000000000000AAFF00000000000000000000000000000000000000",
            "1600000000000000000000000000000000000000000001",  //including length
            "0D0120",  //including length
        ]

    },

    stringTestSchema:{

        fields: {

            field0: {
                type: "string",
                default: '1929 THE GREAT CRASH 儿童游戏',
                fixedBytes: 25,
                specifyLength: true,
            },

            field1: {
                type: "string",
                default: '1929 THE GREAT CRASH 儿童游戏',
                fixedBytes: 30,
                specifyLength: true,
            },

            field2: {
                type: "string",
                default: '1929 THE GREAT CRASH 儿童游戏',
                fixedBytes: 30,

                specifyLength: true,
            },

            field3: {
                type: "string",
                default: 'Remember B. Madoff',
                maxSize: 255,
                minSize: 0,
            },

            field4: {
                type: "string",
                default: 'SATOSHI',
                maxSize: 255,
                minSize: 0,
            },

            field5: {
                type: "string",
                default: 'NAKAMOTO',
                maxSize: 255,
                minSize: 0,

            },

            field6: {
                type: "string",
                default: 'WAS HERE',

                fixedBytes: 255,
            },

            field7: {
                type: "string",
                default: 'GL',

                fixedBytes: 255,
                specifyLength: true,
            },

        },

        saving: {
            enabled: true,
        },

        data: [
            '1929 THE GREAT CRASH 儿童游戏',
            Buffer.concat([ Buffer.from('1929 THE GREAT CRASH 儿童游戏', "utf8"), Buffer.alloc(5) ]).toString("utf8"),
            Buffer.concat([ Buffer.from('1929 THE GREAT CRASH 儿童游戏', "utf8"), Buffer.alloc(5) ]).toString("utf8"),
            'Remember B. Madoff',
            'SATOSHI',
            'NAKAMOTO',
            Buffer.concat([ Buffer.from('WAS HERE', "utf8"), Buffer.alloc(247) ]).toString("utf8"),
            Buffer.concat([ Buffer.from('GL', "utf8"), Buffer.alloc(253) ]).toString("utf8"),
        ],

        json: [
            '1929 THE GREAT CRASH 儿童游戏',
            '1929 THE GREAT CRASH 儿童游戏',
            '1929 THE GREAT CRASH 儿童游戏',
            'Remember B. Madoff',
            'SATOSHI',
            'NAKAMOTO',
            'WAS HERE',
            'GL',
        ],

        output:[
            Buffer.from( "21", "hex").toString("utf8") +'1929 THE GREAT CRASH 儿童游戏', //exactly 25
            Buffer.concat([ Buffer.from( "21", "hex"), Buffer.from('1929 THE GREAT CRASH 儿童游戏', "utf8") ]).toString("utf8"), //adding blank characters
            Buffer.from( "21", "hex").toString("utf8") + '1929 THE GREAT CRASH 儿童游戏', //sepcify length
            Buffer.from( "12", "hex").toString("utf8") + 'Remember B. Madoff', //specify length by default
            Buffer.from( "07", "hex").toString("utf8") + 'SATOSHI', //specify length
            Buffer.from( "08", "hex").toString("utf8") + 'NAKAMOTO', //specify length
            Buffer.concat([ Buffer.from( "08", "hex"), Buffer.from('WAS HERE', "utf8") ]).toString("utf8"), //adding blank characters
            Buffer.concat([ Buffer.from( "02", "hex"), Buffer.from('GL', "utf8")]).toString("utf8"),
        ]

    },

    multilevelMarshalSchema:{

        fields: {

            field0: {
                type: "object",
                default: function () {
                    return new TestClass1(this._scope);
                },
                classObject: TestClass1,
            },

            field1: {
                type: "array",

                default: function () {
                    return [
                        new TestClass1(this._scope),
                        new TestClass1(this._scope),
                        new TestClass1(this._scope),
                    ];
                },

                classObject: TestClass1,

                maxSize: 255,
                minSize: 0,
            },


        },

        saving: {
            enabled: true,
        }

    },

    schemaObjects:{

        fields:{

            field0: {
                type: "buffer",
                fixedBytes: 32,
                default: Buffer.from("0000000000000000000000AAFF00000000000000000000000000000000000000", "hex"),
            },
            field1: {
                type: "object",
                classObject: DBSchemaBuffer,
                default() {
                    return this._createSchemaObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field1");
                },
            },
            field2: {
                type: "array",
                classObject: DBSchemaBuffer,
                default() {
                    return [
                        this._createSchemaObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                        this._createSchemaObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                        this._createSchemaObject( {buffer: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field2"),
                    ]
                },
            },
            field3:{
                type: "array",
                classObject: TestClassStoreData,
                default() {
                    return [
                        this._createSchemaObject( {field0: "0000000000000000000000AAFF00000000000000000000000000000000000000", field1: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field3"),
                        this._createSchemaObject( {field0: "0000000000000000000000AAFF00000000000000000000000000000000000000", field1: "0000000000000000000000AAFF00000000000000000000000000000000000000"}, "object", "field3"),
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

    },

    
}