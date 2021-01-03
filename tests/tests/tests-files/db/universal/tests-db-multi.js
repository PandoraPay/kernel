import describe from 'tests/tests/unit-testing/describe';
import MarshalTests from "tests/tests/tests-files/marshal/marshal-tests"
import DBSchema from "src/db/db-generic/db-schema";
import MasterCluster from "src/cluster/master-cluster";
import Helper from "src/helpers/helper";

/**
 *
 * REDIS BENCHMARK
 *
 */

export default async function run ( dbType) {

    const TEST1 = dbType === "CouchDB" ?  300 : 10001;

    class classSchema extends DBSchema {
        constructor(scope, sc={}, data, type, onlyFields, emptyObject){
            super(scope, {...MarshalTests.schemaSimple}, data, type, onlyFields, emptyObject);
        }
    }

    describe( () => `${dbType} DB Master CLuster testing subscription ${TEST1}`, {

        "creation objects subscription": async function () {

            const masterCluster = await this._scope.app.createMasterCluster(  undefined, {
                argv: {
                    masterCluster:{
                        workerEnv:{
                            testDescribe1: `${dbType} Test`,
                            testName1: `${dbType} Connect`,
                        }
                    }
                }
            });

            await masterCluster.start();

            const obj = new classSchema(this._scope);

            if ( masterCluster.isMaster ) { //master

                await Helper.sleep(3000);

                await obj.subscribe();

                await obj.subscribeMessage("testMessage", {result: true} );

                await Helper.waitUntilCondition( () => masterCluster.stickyMaster.workers.length === 0, undefined, 55000 );

                await masterCluster.close();

            } else  { //slave

                await obj.subscribe();

                await Helper.promiseTimeout(
                    await new Promise( resolve=>{

                        obj.subscription.on(  data => {

                            if (data.name === "testMessage"){

                                if ( data.data && data.data.result )
                                    resolve(true);

                            }

                        });

                    }), 500000 );

                process.exit(1);

            }

        },

    });

    describe( ()=> `${dbType} Multi DB Master CLuster${TEST1}`, {

        "creation objects": async function () {

            const masterCluster = await this._scope.app.createMasterCluster(  undefined, {
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

            if ( masterCluster.isMaster ) { //master

                await Helper.waitUntilCondition( () => masterCluster.stickyMaster.workers.length === 0, undefined, 55000 );

                const data = await this.db.findAll( classSchema, "multi1" );

                const param = dbType !== "PouchDB" ? this._scope.argv.masterCluster.workerCount : 0;

                this.expect(data.length, TEST1  * param);

                await masterCluster.close();

            } else  { //slave

                const array = [];
                for (let i = 0; i < TEST1; i++)
                    array.push(this.db.createSchemaInstance( MarshalTests.schemaSimple ));

                await Promise.all(array.map(async (it, index) => {

                    if (index % 10000 === 0 && index > 0)
                        this._scope.logger.info( "tests", `Saving ${index} `);

                    return it.save(`multi1`)
                }));

                process.exit(1);

            }
            
        },

    })

}