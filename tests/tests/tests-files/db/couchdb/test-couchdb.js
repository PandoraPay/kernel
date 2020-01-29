import describe from 'tests/tests/unit-testing/describe';
import DBConstructor from "src/db/db-constructor";

import TestsDB from "./../universal/tests-db"
import TestsDBBenchmark from "../universal/tests-db-benchmark";
import TestsDBMulti from "../universal/tests-db-multi"

import Helper from "src/helpers/helper";
import TestsMerkleTreeDB from "../../data-structures/merkle-tree/tests-merkle-tree-db";
import cluster from 'src/cluster/cluster';

/**
 *
 * UNIT TESTING FOR COUCH DB
 *
 */

export default async function run() {

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

    await TestsMerkleTreeDB("CouchDB");

    await TestsDB( "CouchDB" );

    await TestsDBBenchmark("CouchDB");

    await TestsDBMulti("CouchDB");

}
