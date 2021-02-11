const describe = require('../../../unit-testing/describe');
const DBConstructor = require( "../../../../../src/db/db-constructor");
const cluster = require( '../../../../../src/cluster/cluster');

const TestsDB = require( "./../universal/tests-db")
const TestsDBBenchmark = require( "../universal/tests-db-benchmark");
const TestsDBMulti = require( "../universal/tests-db-multi");

const Helper = require( "../../../../../src/helpers/helper");
const TestsMerkleTreeDB = require( "../../data-structures/merkle-tree/tests-merkle-tree-db");


/**
 *
 * UNIT TESTING FOR POUCH DB
 *
 */

module.exports = async function run() {

    describe("PouchDB Test", {

        'PouchDB Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db: {
                            ...this._scope.argv.dbPublic,
                            selectedDB: "pouch",
                            pouchDB:{
                                ...this._scope.argv.dbPublic.pouchDB,
                                path: this._scope.argv.dbPublic.pouchDB.path+"_test" + (cluster.worker ? process.env.SLAVE_INDEX : 'master'), //necessary to include
                            }
                        }
                    }
                }, true )
            );

            await this.db.connectDB();

            await this.db.client.destroy();

        },

    });

    await TestsMerkleTreeDB("PouchDB");

    await TestsDB( "PouchDB" );

    await TestsDBBenchmark( "PouchDB");

    await TestsDBMulti( "PouchDB");

}
