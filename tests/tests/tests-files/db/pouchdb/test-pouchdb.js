import describe from 'tests/tests/unit-testing/describe';
import DBConstructor from "src/db/db-constructor";

import TestsDB from "./../universal/tests-db"
import TestsDBBenchmark from "../universal/tests-db-benchmark";
import TestsDBMulti from "../universal/tests-db-multi";

import Helper from "src/helpers/helper";
import TestsMerkleTreeDB from "../../data-structures/merkle-tree/tests-merkle-tree-db";

import cluster from 'src/cluster/cluster';

/**
 *
 * UNIT TESTING FOR POUCH DB
 *
 */

export default async function run() {

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
