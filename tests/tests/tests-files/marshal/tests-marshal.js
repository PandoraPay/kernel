const describe = require('../../unit-testing/describe');
const Model = require("../../../../src/marshal/model");
const MarshalTests = require("../../tests-files/marshal/marshal-tests")
const BN = require("bn.js")
const SchemaBuild = require("../../../../src/marshal/schemas/schema-build");
const BufferHelper = require("../../../../src/helpers/buffers/buffer-helper")

/**
 *
 * UNIT TESTING FOR Marshal / Unmarshal
 *
 */

module.exports = function run () {
    
    describe("Model", {

        'creation': async function () {

            const schema = MarshalTests.testSimpleSchema;
            const schemaBuilt = new SchemaBuild(schema);
            const obj = new Model( this._scope, schemaBuilt );

            this.expect(typeof obj, "object");
            this.expect(obj.noFields, schema.output.length);

            this.expect(typeof obj.toJSON(false), "object");

            this.expect(typeof obj.toString(), "string");
            this.expect( (obj.toString()).length > 20, true);

            //validate the existence of the data
            const json = obj.toJSON(false);

            schema.output.map( (it, index) => {
                if (it instanceof BN){
                    this.expect(typeof json["field" + index], "string");
                    this.expect(json["field" + index], it.toString() );
                } else {
                    this.expect(typeof json["field" + index], typeof it);
                    this.expect(json["field" + index], it);
                }
            });

            //validate buffer
            this.expect(Buffer.isBuffer(obj.toBuffer()), true);
            this.expect((obj.toBuffer()).length > 10, true);


            const obj2 = new Model(this._scope, schemaBuilt );
            obj2.fromJSON(json);

            this.expect(obj.toString(), obj2.toString());
            this.expect(obj.toBuffer(), obj2.toBuffer());

            const json2 = obj2.toJSON(false);

            schema.output.forEach( (it, index) => {
                if (it instanceof BN) {
                    this.expect(typeof json2["field" + index], "string");
                    this.expect(json2["field" + index], it.toString() );
                } else {
                    this.expect(typeof json2["field" + index], typeof it);
                    this.expect(json2["field" + index], it);
                }
            });

        },

        'many buffer tests': async function(){
            const schema = { fields: {
                field1: {
                    type: "buffer",
                    minSize: 255,
                    maxSize: 255,
                },
                field2: {
                    type: "buffer",
                    minSize: 256,
                    maxSize: 256,
                },
                field3: {
                    type: "buffer",
                    maxSize: 257,
                    removeLeadingZeros: true,
                },
                field4:{
                    type: "buffer",
                    minSize: 255,
                    maxSize: 255,
                    removeLeadingZeros: true,
                },
                field5:{
                    type: "buffer",
                    maxSize: 255,
                    minSize: 0,

                    removeLeadingZeros: true,
                },
                field6:{
                    type: "buffer",
                    maxSize: 255,
                    minSize: 0,

                    removeLeadingZeros: false,
                }
            } };
            const schemaBuilt = new SchemaBuild(schema);
            for (let i=0; i < 10000; i++){
                const obj = new Model(this._scope, schemaBuilt, {
                    field1: BufferHelper.generateRandomBuffer(255),
                    field2: BufferHelper.generateRandomBuffer(256),
                    field3: BufferHelper.generateRandomBuffer(i % 5 ? 255: 30),
                    field4: BufferHelper.generateRandomBuffer(255),
                    field5: BufferHelper.generateRandomBuffer(i % 5 ? 255: 30),
                    field6: BufferHelper.generateRandomBuffer(i % 5 ? 255: 30),
                }, "object", {skipProcessingConstructionValues: true} );

                const obj2 = new Model(this._scope, schemaBuilt);
                obj2.fromBuffer(obj.toBuffer() );

                const obj3 = new Model(this._scope, schemaBuilt);
                obj3.fromJSON(obj.toJSON(true));
            }
        },

        'buffer tests': async function () {

            const schema = MarshalTests.testBufferSchema;
            const schemaBuilt = new SchemaBuild(schema);

            const obj = new Model(this._scope, schemaBuilt );
            const json = obj.toJSON(false);

            schema.data.map( (it, index) => {
                this.expect( Buffer.from( it, "hex"), obj["field" + index]  );
            });

            schema.json.map( (it, index) => {
                this.expect( json["field" + index].toString("hex").toLowerCase(), it.toLowerCase() );
            });

            schema.output.map( (it, index) => {

                const onlyFields = {};
                onlyFields["field"+index] = true;

                const buffer = obj.toBuffer( undefined, { onlyFields });
                this.expect( buffer.toString("hex").toLowerCase(), it.toLowerCase() );

            });

            const obj2 = new Model(this._scope, schemaBuilt );
            obj2.fromJSON(json);

            this.expect( obj.toString(), obj2.toString());
            this.expect( obj.toBuffer(), obj2.toBuffer());

            schema.data.map( (it, index) => {
                this.expect( Buffer.from( it, "hex"), obj2["field" + index]  );
            });

            const json2 = obj.toJSON(false);
            schema.json.map( (it, index) => {
                this.expect( json2["field" + index].toString("hex").toLowerCase(), it.toLowerCase() );
            });

            schema.output.map( (it, index) => {

                const onlyFields = {};
                onlyFields["field"+index] = true;

                const buffer = obj2.toBuffer( undefined, { onlyFields });
                this.expect( buffer.toString("hex").toLowerCase(), it.toLowerCase() );

            });

            const obj3 = new Model(this._scope, schemaBuilt );
            obj3.fromBuffer( obj2.toBuffer() );

            this.expect( obj.toString(), obj3.toString());
            this.expect( obj.toBuffer(), obj3.toBuffer());

            schema.data.map( (it, index) => {
                this.expect( Buffer.from( it, "hex"), obj3["field" + index]  );
            });

            const json3 = obj.toJSON(false);
            schema.json.map( (it, index) => {
                this.expect( json3["field" + index].toString("hex").toLowerCase(), it.toLowerCase() );
            });

            schema.output.map( (it, index) => {

                const onlyFields = {};
                onlyFields["field"+index] = true;

                const buffer = obj3.toBuffer( undefined, { onlyFields });
                this.expect( buffer.toString("hex").toLowerCase(), it.toLowerCase() );

            });

        },

        'string tests': async function () {

            const schema = MarshalTests.testStringSchema;
            const schemaBuilt = new SchemaBuild(schema);

            const obj = new Model(this._scope, schemaBuilt );

            schema.data.map( (it, index) => {
                this.expect( it, obj["field" + index]  );
            });


            const json = obj.toJSON(false);
            schema.json.map( (it, index) => {
                this.expect( json["field" + index], it );
            });


            schema.output.map( (it, index) => {
                const onlyFields = {};
                onlyFields["field"+index] = true;

                const buffer = obj.toBuffer( undefined, { onlyFields });
                this.expect( buffer.toString("utf8"), it );
            });


            const obj2 = new Model(this._scope, schemaBuilt );
            obj2.fromJSON(json);

            this.expect(obj.toString(), obj2.toString());
            this.expect(obj.toBuffer(), obj2.toBuffer());
            this.expect(obj.toHex(), obj2.toHex());

            schema.data.map( (it, index) => {
                this.expect( it, obj2["field" + index]  );
            });

            const json2 = obj.toJSON(false);
            schema.json.map( (it, index) => {
                this.expect( json2["field" + index], it );
            });


            schema.output.map( (it, index) => {
                const onlyFields = {};
                onlyFields["field"+index] = true;

                const buffer = obj2.toBuffer( undefined, { onlyFields });
                this.expect( buffer.toString("utf8"), it );
            });

            const obj3 = new Model(this._scope, schemaBuilt );
            obj3.fromBuffer( obj2.toBuffer() );

            this.expect( obj.toString(), obj3.toString());
            this.expect( obj.toBuffer(), obj3.toBuffer());

            schema.data.map( (it, index) => {
                this.expect( it, obj3["field" + index]  );
            });

            const json3 = obj.toJSON(false);
            schema.json.map( (it, index) => {
                this.expect( json3["field" + index], it );
            });

            schema.output.map( (it, index) => {

                const onlyFields = {};
                onlyFields["field"+index] = true;

                const buffer = obj3.toBuffer( undefined, { onlyFields });
                this.expect( buffer.toString("utf8"), it );

            });

        },

        "multi level marshal": async function(){

            const schema = MarshalTests.testMultilevelSchema;
            const schemaBuilt = new SchemaBuild(schema);

            const obj = new Model(this._scope, schemaBuilt);

            const json = obj.toJSON(false);

            this.expect( typeof json["field0"], "object");
            this.expect( json["field0"].field0, Buffer.from("0a0420000420000420","hex"));

            this.expect( Array.isArray(json["field1"]), true);
            this.expect( json["field1"].length, obj.field1.length);
            this.expect( json["field1"][0].field0, Buffer.from("0a0420000420000420","hex"));
            this.expect( json["field1"][1].field0, Buffer.from("0a0420000420000420","hex"));
            this.expect( json["field1"][2].field0, Buffer.from("0a0420000420000420","hex"));

            const obj2 = new Model(this._scope, schemaBuilt );
            obj2.fromJSON(json);

            this.expect( obj.toString(), obj2.toString() );
            this.expect( obj.toBuffer(), obj2.toBuffer() );
            this.expect( obj.toHex(), obj2.toHex() );

        }

    });

}