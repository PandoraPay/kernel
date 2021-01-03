import ArgvTest from "./argv/argv-test";

import TestSimple from "./tests-files/test-simple";
import TestMarshal from "./tests-files/marshal/test-marshal";
import TestsMarshalData from "./tests-files/marshal/tests-marshal-data";

import TestHelpers from "./tests-files/helpers/tests-helpers";
import TestMasterCluster from "./tests-files/cluster/test-master-cluster";

import TestCouch from "./tests-files/db/couchdb/test-couchdb";
import TestPouch from "./tests-files/db/pouchdb/test-pouchdb";
import TestRedis from "./tests-files/db/redis/tests-redis";

import TestMerkleTree from "./tests-files/data-structures/merkle-tree/tests-merkle-tree";
import TestRadixTree from "./tests-files/data-structures/radix-tree/tests-radix-tree";
import TestHashVirtualMap from "./tests-files/data-structures/hash-map/test-hash-virtual-map";
import TestHashMap from "./tests-files/data-structures/hash-map/test-hash-map";

export default {

    argvTests: ArgvTest,

    tests: async scope =>{

        await TestHashMap(scope);
        await TestHashVirtualMap(scope);

        await TestRadixTree(scope);

        await TestMerkleTree();

        //await TestRedis();

        await TestHelpers( );

        await TestsMarshalData();

        await TestMarshal( );

        await TestSimple( );

        await TestMasterCluster( );

        await TestCouch();
        await TestPouch();

    },

};
