const describe = require('../../../unit-testing/describe');
const DBConstructor = require( "../../../../../src/db/db-constructor");
const cluster = require( '../../../../../src/cluster/cluster');

const TestsDB = require( "./../universal/tests-db")
const TestsDBBenchmark = require( "../universal/tests-db-benchmark");
const TestsDBMulti = require( "../universal/tests-db-multi");

const Helper = require( "../../../../../src/helpers/helper");

const TestsMerkleTreeDB = require( "../../data-structures/merkle-tree/tests-merkle-tree-db")

/**
 *
 * UNIT TESTING FOR REDIS
 *
 */

module.exports = async function run () {


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
