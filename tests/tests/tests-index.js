const ArgvTest = require("./argv/argv-test");

const TestsSimple = require( "./tests-files/tests-simple");
const TestsMarshal = require( "./tests-files/marshal/tests-marshal");
const TestsMarshalData = require( "./tests-files/marshal/tests-marshal-data");

const TestsHelpers = require( "./tests-files/helpers/tests-helpers");
const TestsMasterCluster = require( "./tests-files/cluster/tests-master-cluster");

const TestsCouch = require( "./tests-files/db/couchdb/tests-couchdb");
const TestsPouch = require( "./tests-files/db/pouchdb/tests-pouchdb");
const TestsRedis = require( "./tests-files/db/redis/tests-redis");

const TestsMerkleTree = require( "./tests-files/data-structures/merkle-tree/tests-merkle-tree");
const TestsRadixTree = require( "./tests-files/data-structures/radix-tree/tests-radix-tree-index");
const TestsHashMap = require( "./tests-files/data-structures/hash-map/tests-hash-map-index");

module.exports = {

    argvTests: ArgvTest,

    tests: async scope =>{

        await TestsHashMap(scope);

        await TestsRadixTree(scope);

        await TestsMerkleTree();
        // //
        // // //await TestsRedis();
        //
        await TestsHelpers( );

        await TestsMarshalData();

        await TestsMarshal( );

        await TestsSimple( );

        await TestsMasterCluster( );

        await TestsCouch();
        await TestsPouch();

    },

};
