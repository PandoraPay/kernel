const describe = require('../../../unit-testing/describe');
const DBConstructor = require( "../../../../../src/db/db-constructor");
const cluster = require('../../../../../src/cluster/cluster');
const Helper = require( "../../../../../src/helpers/helper");

const TestsDB = require("./../universal/tests-db")
const TestsDBBenchmark = require( "../universal/tests-db-benchmark");
const TestsDBMulti = require("../universal/tests-db-multi")

const TestsMerkleTreeDB = require("../../data-structures/merkle-tree/tests-merkle-tree-db");

/**
 *
 * UNIT TESTING FOR COUCH DB
 *
 */

module.exports = async function run() {

    describe("CouchDB Test", {

        'CouchDB Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db: {
                            ...this._scope.argv.dbPublic,
                            selectedDB: "couch",
                            couchDB:{
                                ...this._scope.argv.dbPublic.couchDB,
                                db: this._scope.argv.dbPublic.couchDB.db+"_test",
                            }
                        }
                    }
                }, true )
            );

            await this.db.connectDB();

            if (!cluster.worker)
                await this.db.client.destroy();

        },

    });

    // await TestsMerkleTreeDB("CouchDB");

    await TestsDB( "CouchDB" );

    await TestsDBBenchmark("CouchDB");

    await TestsDBMulti("CouchDB");

}
