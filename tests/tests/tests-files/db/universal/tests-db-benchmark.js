const describe = require( '../../../unit-testing/describe');
const MarshalTests = require( "../../../tests-files/marshal/marshal-tests")
const DBSchemaBuild = require( "../../../../../src/db/db-generic/db-schema-build");
/**
 *
 * REDIS BENCHMARK
 *
 */

module.exports = async function run ( dbType) {

    const TEST1 = (dbType === "CouchDB" ?  300 : 20001);

    const schema = MarshalTests.testSimpleSchema;
    const schemaBuilt = new DBSchemaBuild(schema);

    describe( ()=>`${dbType} Benchmark 1) ${TEST1}`, {

        "creation objects": async function () {

            for (let i = 0; i < TEST1; i++) {

                const obj = this.db.createModelInstance( schemaBuilt );

                for (let i = 0; i < schema.output.length; i++) {
                    this.expect(typeof obj["field" + i], typeof schema.output[i]);
                    this.expect(obj["field" + i], schema.output[i]);
                }

            }
        },

        "creation and saving objects": async function () {

            const array = [];
            for (let i = 0; i < TEST1; i++)
                array.push( this.db.createModelInstance( schemaBuilt ) );

            await Promise.all(array.map(async (it, index) => {
                
                if (index % 10000 === 0 && index > 0)
                    this._scope.logger.info( "tests", `Saving ${index} `);
                
                return it.save(`benchmark1`)
            }))


        },

        "loading objects": async function () {

            const data = await this.db.findAll( undefined, schemaBuilt, "benchmark1" );
            this.expect(data.length, TEST1)

        },

        "delete objects": async function () {

            await this.db.deleteAll( undefined, schemaBuilt, "benchmark1" );

            const data = await this.db.findAll( undefined, schemaBuilt, "benchmark1" );
            this.expect(data.length, 0)

        },

    })

}