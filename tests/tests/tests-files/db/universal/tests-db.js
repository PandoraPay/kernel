import describe from 'tests/tests/unit-testing/describe';
import MarshalTests from "tests/tests/tests-files/marshal/marshal-tests"
import SchemaTests from "tests/tests/tests-files/marshal/tests-schema"
import Helper from "src/helpers/helper"
/**
 *
 * UNIT TESTING FOR REDIS
 *
 */

export default async function run ( dbType ) {

    let masterCluster;

    describe( ()=>`${dbType} Deadlocks`, {

        'initialize master cluster': async function (){

            masterCluster = await this._scope.app.createMasterCluster(    undefined, {
                argv: {
                    masterCluster:{
                        workerEnv:{
                            testDescribe1: `${dbType} Test`,
                            testName1: `${dbType} Connect`,
                        }
                    }
                },
                db: this.db,
                client: this.db.client,
            });
            await masterCluster.start();

        },

        'deadlock creation': async function () {

            const lock1 = await this.db.client.lock("lock1", 5000, -1);

            this.expect( lock1 === undefined, false);
            this.expect( typeof lock1, "function");

            await Helper.sleep(1000);

            //release the deadlock, it should be free now
            await lock1();

            const lock1_copy = await this.db.client.lock("lock1", 5000, -1);

            this.expect( lock1_copy === undefined, false);
            this.expect( typeof lock1_copy, "function");

            await lock1_copy();
        },

        'deadlock wait 2 sec and create again': async function (){

            const lock1 = await this.db.client.lock("lock1", 50000, -1);
            this.expect( lock1 === undefined, false);
            this.expect( typeof lock1, "function");

            await Helper.sleep(2000);

            //lock1 should be busy

            const lock1_copy = await this.db.client.lock("lock1", 5000, -1);
            this.expect( lock1_copy , undefined);
            this.expect( typeof lock1_copy , "undefined");

            await lock1();


            let lock1_copy2 = await this.db.client.lock("lock1", 5000, -1);
            this.expect( lock1 === undefined, false);
            this.expect( typeof lock1, "function");

            await lock1_copy2();

        },

        'close master cluster': async function (){

            masterCluster.close();

        },

    });


    describe( ()=>`${dbType} Tests`, {

        'creation, save, load from object and json': async function () {

            const schema = {...MarshalTests.schemaSimple};

            schema.fields = {

                table:{
                    default: "TS1",
                },
                id:{
                    default: "test_table_1_402",
                },

                ...schema.fields,
            };

            const obj = this.db.createSchemaInstance( schema );

            for (let i=0; i<schema.output.length; i++) {
                this.expect( typeof obj["field" + i], typeof schema.output[i] );
                this.expect( obj["field" + i], schema.output[i] );
            }

            await obj.save(undefined, undefined, undefined, undefined, "object");

            const json1 = obj.toString();

            obj.id = "test_table_1_403";

            obj.field1 = 777;
            obj.field2 = "Remember, remember the 5th of November";
            obj.field4 = Buffer.from("0000000001", "hex");

            await obj.save(undefined, undefined, undefined, undefined, "json");

            const json2 = obj.toString();

            const obj2 = this.db.createSchemaInstance( schema );

            await obj2.load("test_table_1_402");
            this.expect(json1, obj2.toString() );

            await obj2.load("test_table_1_403", undefined, undefined, undefined,  "json");
            this.expect(json2, obj2.toString() );



        },

        'multiple buffers test': async function () {

            let schema = {...MarshalTests.bufferTestsSchema};

            schema.fields = {

                table:{
                    default: "TS2",
                },
                id:{
                    default: "test_table_2_402",
                },

                ...schema.fields,
            };


            const obj = this.db.createSchemaInstance( schema );

            const json = obj.toJSON(false);

            for (let i=0; i<schema.output.length; i++) {
                this.expect( typeof json["field" + i].toString("hex"), typeof schema.json[i]);
                this.expect( json["field" + i].toString("hex").toLowerCase(), schema.json[i].toLowerCase() );
            }

            await obj.save();

            const obj2 = this.db.createSchemaInstance( schema );

            await obj2.load();

            this.expect( obj.toString(), obj2.toString());
            this.expect( obj.toBuffer(), obj2.toBuffer());

            const json2 = obj2.toJSON(false);
            for (let i=0; i<schema.output.length; i++) {
                this.expect( typeof json2["field" + i].toString("hex"), typeof schema.json[i]);
                this.expect( json2["field" + i].toString("hex").toLowerCase(), schema.json[i].toLowerCase());
            }

        },

        "multi hierarchy": async function (){

            const schema = {...MarshalTests.multilevelMarshalSchema};

            const obj = this.db.createSchemaInstance( schema );

            const json = obj.toJSON(false);

            this.expect( typeof json["field0"], "object");
            this.expect( json["field0"].field0, Buffer.from("0a0420000420000420","hex"));

            this.expect( Array.isArray(json["field1"]), true);
            this.expect( json["field1"].length, obj.field1.length);
            this.expect( json["field1"][0].field0, Buffer.from("0a0420000420000420","hex"));
            this.expect( json["field1"][1].field0, Buffer.from("0a0420000420000420","hex"));
            this.expect( json["field1"][2].field0, Buffer.from("0a0420000420000420","hex"));

            await obj.save("TS3");

            const obj2 = this.db.createSchemaInstance( schema );

            await obj2.load(obj.id, "TS3",);

            this.expect(obj.toString(), obj2.toString());
            this.expect(obj.toBuffer(), obj2.toBuffer());
            this.expect(obj.toHex(), obj2.toHex());


        },

        "multi hierarchy DELETE": async function (){

            const schema = {...MarshalTests.multilevelMarshalSchema};

            const obj = this.db.createSchemaInstance( schema );

            await this.expect( await this.db.client.existsAny("TS3_DELETE"), false);

            await obj.save("TS3_DELETE");

            await this.expect( await this.db.client.existsAny("TS3_DELETE"), true);

            const obj2 = this.db.createSchemaInstance( schema );

            await obj2.load(obj.id, "TS3_DELETE");

            await obj.delete("TS3_DELETE");

            await this.expect( await this.db.client.existsAny("TS3_DELETE") , false);

        },

        'schemaObjects': async function () {

            const schema = {...MarshalTests.schemaObjects};

            const obj = this.db.createSchemaInstance( schema );

            const json = obj.toJSON(true);

            this.expect( JSON.stringify(json) === JSON.stringify(schema.json), true);

            await obj.save("TS4");

            const obj2 = this.db.createSchemaInstance( schema );

            await obj2.load(obj.id, "TS4",);

            const json2 = obj2.toJSON(true);

            this.expect( JSON.stringify(json2) === JSON.stringify(schema.json), true);

            this.expect(obj.toString(), obj2.toString());
            this.expect(obj.toBuffer(), obj2.toBuffer());
            this.expect(obj.toHex(), obj2.toHex());

            await obj.delete("TS4");

            await this.expect( await this.db.client.existsAny("TS4") , false);

        },

        "DELETE ALL": async function (){

            const count = 42;

            const schema = MarshalTests.bufferTestsSchema.schema;

            const obj = this.db.createSchemaInstance( schema );

            await this.expect( await this.db.client.existsAny("TS4_DELETE_ALL") , false );

            for (let i=0; i<count; i++)
                await obj.save("TS4_DELETE_ALL", undefined, `object_${i}`);


            await this.expect( await this.db.client.countAny("TS4_DELETE_ALL"),  count);

            await obj.deleteAllSiblings("TS4_DELETE_ALL");

            await this.expect( await this.db.client.existsAny("TS4_DELETE_ALL"), false );

        },


    });

    describe(()=>`${dbType} UNIQUE TESTS`,{

        "declare schemas": async function () {

        },

        "UNIQUE test": async function(){

            const obj1 = this.db.createSchemaInstance( SchemaTests.simpleUnique );
            await obj1.save("TEST_UNIQUE");

            const obj1_1 = this.db.createSchemaInstance( SchemaTests.simpleUnique );
            await obj1_1.load(obj1.id, "TEST_UNIQUE");
            this.expect(obj1_1.field0, obj1.field0);

            const obj2 = this.db.createSchemaInstance( SchemaTests.simpleUnique );
            obj2.field0 = "THE PEOPLE";
            await obj2.save("TEST_UNIQUE");

            const obj3 = this.db.createSchemaInstance( SchemaTests.simpleUnique );
            obj3.field0 = "THE PEOPLE";

            await this.expectError( obj3.save("TEST_UNIQUE") );

            obj3.id =  obj2.id;

            await obj3.save("TEST_UNIQUE");

        },

    })

}
