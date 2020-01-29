import describe from 'tests/tests/unit-testing/describe';
import MarshalTests from "tests/tests/tests-files/marshal/marshal-tests"
import DBSchema from "src/db/db-generic/db-schema";

/**
 *
 * REDIS BENCHMARK
 *
 */

export default async function run ( dbType) {

    const TEST1 = (dbType === "CouchDB" ?  300 : 20001);

    class classSchema extends DBSchema {
        constructor(scope, sc={}, data, type, onlyFields, emptyObject){
            super(scope, {...MarshalTests.schemaSimple}, data, type, onlyFields, emptyObject);
        }
    }

    describe( ()=>`${dbType} Benchmark 1) ${TEST1}`, {

        "creation objects": async function () {

            for (let i = 0; i < TEST1; i++) {

                const schema = {...MarshalTests.schemaSimple};
                const obj = this.db.createSchemaInstance( schema );

                for (let i = 0; i < schema.output.length; i++) {
                    this.expect(typeof obj["field" + i], typeof schema.output[i]);
                    this.expect(obj["field" + i], schema.output[i]);
                }

            }
        },

        "creation and saving objects": async function () {

            const array = [];
            for (let i = 0; i < TEST1; i++)
                array.push( this.db.createSchemaInstance( MarshalTests.schemaSimple ) );

            await Promise.all(array.map(async (it, index) => {
                
                if (index % 10000 === 0 && index > 0)
                    this._scope.logger.info( "tests", `Saving ${index} `);
                
                return it.save(`benchmark1`)
            }))


        },

        "loading objects": async function () {

            const data = await this.db.findAll( classSchema, "benchmark1" );
            this.expect(data.length, TEST1)

        },

        "delete objects": async function () {

            await this.db.deleteAll( classSchema, "benchmark1" );

            const data = await this.db.findAll( classSchema, "benchmark1" );
            this.expect(data.length, 0)

        },

    })

}