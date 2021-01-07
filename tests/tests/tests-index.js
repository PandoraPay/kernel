import ArgvTest from "./argv/argv-test";

import TestsSimple from "./tests-files/tests-simple";
import TestsMarshal from "./tests-files/marshal/tests-marshal";
import TestsMarshalData from "./tests-files/marshal/tests-marshal-data";

import TestsHelpers from "./tests-files/helpers/tests-helpers";
import TestsMasterCluster from "./tests-files/cluster/tests-master-cluster";

import TestsCouch from "./tests-files/db/couchdb/tests-couchdb";
import TestsPouch from "./tests-files/db/pouchdb/tests-pouchdb";
import TestsRedis from "./tests-files/db/redis/tests-redis";

import TestsMerkleTree from "./tests-files/data-structures/merkle-tree/tests-merkle-tree";
import TestsRadixTree from "./tests-files/data-structures/radix-tree/tests-radix-tree-index";
import TestsRadixTreeRandom from "./tests-files/data-structures/radix-tree/tests-radix-tree-random";
import TestsHashMap from "./tests-files/data-structures/hash-map/tests-hash-map-index";

export default {

    argvTests: ArgvTest,

    tests: async scope =>{

        await TestsHashMap(scope);

        await TestsRadixTree(scope);
        await TestsRadixTreeRandom(scope);

        await TestsMerkleTree();

        //await TestsRedis();

        await TestsHelpers( );

        await TestsMarshalData();

        await TestsMarshal( );

        await TestsSimple( );

        await TestsMasterCluster( );

        await TestsCouch();
        await TestsPouch();

    },

};
