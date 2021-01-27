const describe = require( '../../../unit-testing/describe');
const MarshalTests = require( "../../../tests-files/marshal/marshal-tests")
const DBMarshal = require( "../../../../../src/db/db-generic/db-marshal");
const DBSchemaBuild = require( "../../../../../src/db/db-generic/db-schema-build");
const SchemaMarshal = require("../../../../../src/marshal/schemas/schema-build");
/**
 *
 * REDIS BENCHMARK
 *
 */

module.exports = async function run ( dbType) {

    const TEST1 = (dbType === "CouchDB" ?  300 : 20001);

    const schema = MarshalTests.testSimpleSchema;
    const schemaBuild = new DBSchemaBuild(schema);

    class classSchema extends DBMarshal {
        constructor(scope, sc={}, data, type, onlyFields, emptyObject){
            super(scope, schemaBuild, data, type, onlyFields, emptyObject);
        }
    }

    describe( ()=>`${dbType} Benchmark 1) ${TEST1}`, {

        "creation objects": async function () {

            for (let i = 0; i < TEST1; i++) {

                const obj = this.db.createSchemaInstance( classSchema );

                for (let i = 0; i < schema.output.length; i++) {
                    this.expect(typeof obj["field" + i], typeof schema.output[i]);
                    this.expect(obj["field" + i], schema.output[i]);
                }

            }
        },

        "creation and saving objects": async function () {

            const array = [];
            for (let i = 0; i < TEST1; i++)
                array.push( this.db.createSchemaInstance( classSchema ) );

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