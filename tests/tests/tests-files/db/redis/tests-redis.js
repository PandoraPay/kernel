import describe from 'tests/tests/unit-testing/describe';
import DBConstructor from "src/db/db-constructor";

import TestsDB from "./../universal/tests-db"
import TestsDBBenchmark from "../universal/tests-db-benchmark";
import TestsDBMulti from "../universal/tests-db-multi";

import Helper from "src/helpers/helper";

import TestsMerkleTreeDB from "../../data-structures/merkle-tree/tests-merkle-tree-db"

import cluster from 'src/cluster/cluster';

/**
 *
 * UNIT TESTING FOR REDIS
 *
 */

export default async function run () {


    describe("Redis Test", {

        'Redis Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db:{
                            ...this._scope.argv.dbPublic,
                            selectedDB: "redis",
                            redisDB:{
                                ...this._scope.argv.dbPublic.redisDB,
                                db: this._scope.argv.dbPublic.redisDB.db,
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

    await TestsMerkleTreeDB("Redis");

    await TestsDB(  "Redis");

    await TestsDBBenchmark(  "Redis");

    await TestsDBMulti(  "Redis");


}
