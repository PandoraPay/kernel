const describe = require.main.require('./tests/tests/unit-testing/describe');
const Marshal = require.main.require("./src/marshal/marshal");
const MarshalTests = require.main.require("./tests/tests/tests-files/marshal/marshal-tests")
const BN = require("bn.js")

/**
 *
 * UNIT TESTING FOR Marshal / Unmarshal
 *
 */

module.exports = function run () {
    
    describe("Marshal", {

        'creation': async function () {

            const schema = {...MarshalTests.schemaSimple};

            const obj = new Marshal( this._scope, schema );

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


            const obj2 = new Marshal(this._scope, schema );
            obj2.fromJSON(json);

            this.expect(obj.toString(), obj2.toString());
            this.expect(obj.toBuffer(), obj2.toBuffer());

            const json2 = obj2.toJSON(false);

            schema.output.map( (it, index) => {
                if (it instanceof BN) {
                    this.expect(typeof json2["field" + index], "string");
                    this.expect(json2["field" + index], it.toString() );
                } else {
                    this.expect(typeof json2["field" + index], typeof it);
                    this.expect(json2["field" + index], it);
                }
            });

        },


        'buffer tests': async function () {

            const schema = {...MarshalTests.bufferTestsSchema};

            const obj = new Marshal(this._scope, schema );
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

            const obj2 = new Marshal(this._scope, schema );
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

            const obj3 = new Marshal(this._scope, schema );
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

            const schema = {...MarshalTests.stringTestSchema};

            const obj = new Marshal(this._scope, schema );

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


            const obj2 = new Marshal(this._scope, schema );
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

            const obj3 = new Marshal(this._scope, schema );
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


            const schema = {...MarshalTests.multilevelMarshalSchema};

            const obj = new Marshal(this._scope, schema);


            const json = obj.toJSON(false);

            this.expect( typeof json["field0"], "object");
            this.expect( json["field0"].field0, Buffer.from("0a0420000420000420","hex"));

            this.expect( Array.isArray(json["field1"]), true);
            this.expect( json["field1"].length, obj.field1.length);
            this.expect( json["field1"][0].field0, Buffer.from("0a0420000420000420","hex"));
            this.expect( json["field1"][1].field0, Buffer.from("0a0420000420000420","hex"));
            this.expect( json["field1"][2].field0, Buffer.from("0a0420000420000420","hex"));

            const obj2 = new Marshal(this._scope, schema );
            obj2.fromJSON(json);

            this.expect( obj.toString(), obj2.toString() );
            this.expect( obj.toBuffer(), obj2.toBuffer() );
            this.expect( obj.toHex(), obj2.toHex() );


        }

    });

}