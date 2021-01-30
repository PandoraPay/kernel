const BN = require('bn.js');
const BigNumber = require("bignumber.js");
const { keccak256 } = require('js-sha3');
const sha256 = require( 'sha256');

const AsyncEvents = require("async-events");

const BufferReader = require("./src/helpers/buffers/buffer-reader");

const Logger = require( "./src/helpers/logger/logger");
const Readline = require( "./src/helpers/readline/readline");
const StringHelper = require( "./src/helpers/string-helper");
const Exception = require( "./src/helpers/exception");
const ArrayHelper = require( "./src/helpers/array-helper");
const BufferHelper = require( "./src/helpers/buffers/buffer-helper");
const Helper = require( "./src/helpers/helper");
const CryptoHelper = require( "./src/helpers/crypto/crypto-helper");
const Base58 = require( "./src/helpers/base58-helper");
const Events = require( "./src/helpers/events/events");

const Argv = require( "./bin/argv/argv");
const App = require( './src/app');

const Model = require( "./src/marshal/model");
const MarshalData = require( "./src/marshal/data/marshal-data");
const MarshalFields = require( "./src/marshal/fields/marshal-fields");
const MarshalValidation = require( "./src/marshal/fields/marshal-validation");
const UnmarshalFields = require( "./src/marshal/fields/unmarshal-fields");
const MarshalValidationPreProcessing = require( "./src/marshal/fields/marshal-validation-pre-processing");
const MarshalValidationPreset = require( "./src/marshal/fields/marshal-validation-pre-set");

const SchemaBuild = require( "./src/marshal/schemas/schema-build");

const DBModel = require( "./src/db/db-generic/db-model");
const DBSchemaBuild = require( "./src/db/db-generic/schemas/db-schema-build");
const BufferDBSchemaBuild = require( "./src/db/db-generic/schemas/samples/buffer-db-schema-build");
const BufferUniqueDBSchemaBuild = require( "./src/db/db-generic/schemas/samples/buffer-unique-db-schema-build");
const NumberDBSchemaBuild = require( "./src/db/db-generic/schemas/samples/number-db-schema-build");
const StringDBSchemaBuild = require( "./src/db/db-generic/schemas/samples/string-db-schema-build");

const ClientsCluster = require( "./src/cluster/clients/clients-cluster");
const DBModelHelper = require( "./src/db/db-generic/db-model-helper");
const DBConstructor = require( "./src/db/db-constructor");

const AsyncInterval = require( "./src/helpers/async-interval");

const describe = require( './tests/tests/unit-testing/describe');
const describeList = require( './tests/tests/unit-testing/describe-list');
const TestsHelper = require( "./tests/tests/unit-testing/tests-helper");

const TestsFiles = require( "./tests/tests/tests-index");

const MerkleTreeDBModel = require( "./src/data-structures/merkle-tree/merkle-tree-db-model");
const MerkleTreeNodeDBModel = require( "./src/data-structures/merkle-tree/merkle-tree-node-db-model");
const MerkleTreeNodeTypeEnum = require( "./src/data-structures/merkle-tree/merkle-tree-node-type-enum");
const MerkleTreeRootDBModel = require( "./src/data-structures/merkle-tree/merkle-tree-root-db-model");
const MerkleTreeRootDBSchemaBuild = require( "./src/data-structures/merkle-tree/schema/merkle-tree-root-db-schema-build");
const MerkleTreeNodeDBSchemaBuild = require( "./src/data-structures/merkle-tree/schema/merkle-tree-node-db-schema-build");
const MerkleTreeDBSchemaBuild = require( "./src/data-structures/merkle-tree/schema/merkle-tree-db-schema-build");

const RadixTree = require( "./src/data-structures/radix-tree/radix-tree-db-model");
const RadixTreeVirtual3DBModel = require( "./src/data-structures/radix-tree/radix-tree-virtual3-db-model");
const RadixTreeVirtualDBModel = require( "./src/data-structures/radix-tree/radix-tree-virtual-db-model");
const RadixTreeNodeDBModel = require( "./src/data-structures/radix-tree/radix-tree-node-db-model");
const RadixTreeRootDBModel = require( "./src/data-structures/radix-tree/radix-tree-root-db-model");
const RadixTreeNodeTypeEnum = require( "./src/data-structures/radix-tree/radix-tree-node-type-enum");
const RadixTreeRootDBSchemaBuild = require( "./src/data-structures/radix-tree/schema/radix-tree-root-db-schema-build");
const RadixTreeDBSchemaBuild = require( "./src/data-structures/radix-tree/schema/radix-tree-db-schema-build");
const RadixTreeNodeDBSchemaBuild = require( "./src/data-structures/radix-tree/schema/radix-tree-node-db-schema-build");

const HashMapDBModel = require( "./src/data-structures/hash-map/hash-map-db-model");
const HashVirtualMapDBModel = require( "./src/data-structures/hash-map/hash-virtual-map-db-model");
const HashMapElementDBSchemaBuild = require( "./src/data-structures/hash-map/schema/hash-map-element-db-schema-build");

const NetworkTypeEnum = require( "./bin/argv/modules/network-type-enum");

const HeartBeat = require( "./src/heart-beat/heart-beat");
const BansManager = require( "./src/helpers/bans-manager/bans-manager");
const EnumHelper = require( "./src/helpers/enum-helper");
const NumberHelper = require( "./src/helpers/number-helper");

const MasterCluster = require( "./src/cluster/master-cluster");
const BrowserCluster = require( "./src/cluster/browser-cluster");

const cluster = require('./src/cluster/cluster')

// only supported for node.js
const sticky = BROWSER ? undefined : require('sticky-session').default;
const HttpServer = BROWSER ? undefined : require("./src/cluster/server/http-server");
const ServerCluster = BROWSER ? undefined : require("./src/cluster/server/server-cluster");
const RedisDB = BROWSER ? undefined : require( "./src/db/redis-db/redis-db" );
const PouchDB = BROWSER ? undefined : require( "./src/db/pouch-db/pouch-db" );

const library = {

    app: new App({}),

    marshal:{

        Model,

        MarshalData,
        MarshalFields,
        MarshalValidation,
        UnmarshalFields,
        MarshalValidationPreset,
        MarshalValidationPreProcessing,

        SchemaBuild,
    },

    db:{
        DBModel,
        DBSchemaBuild,

        RedisDB,
        PouchDB,

        DBModelHelper,
        DBConstructor,

    },

    schemas :{
        BufferDBSchemaBuild,
        StringDBSchemaBuild,
        NumberDBSchemaBuild,
        BufferUniqueDBSchemaBuild,
    },

    dataStructures: {

        merkleTree:{
            MerkleTreeDBModel,
            MerkleTreeNodeDBModel,
            MerkleTreeRootDBModel,
            MerkleTreeNodeTypeEnum,
            schema:{
                MerkleTreeRootDBSchemaBuild,
                MerkleTreeDBSchemaBuild,
                MerkleTreeNodeDBSchemaBuild,
            }
        },

        radixTree:{
            RadixTree,
            RadixTreeVirtual3DBModel,
            RadixTreeVirtualDBModel,
            RadixTreeNodeDBModel,
            RadixTreeRootDBModel,
            RadixTreeNodeTypeEnum,
            schema:{
                RadixTreeRootDBSchemaBuild,
                RadixTreeDBSchemaBuild,
                RadixTreeNodeDBSchemaBuild,
            },
        },

        hashMap:{
            HashMapDBModel,
            HashVirtualMapDBModel,
            schema:{
                HashMapElementDBSchemaBuild
            }
        }

    },


    masterCluster: {
        MasterCluster,
        BrowserCluster,
        ServerCluster,
        ClientsCluster,
        HttpServer,

        sticky,
        cluster,
    },

    utils: {
        App,
        Argv,
        Logger,
        HeartBeat,
        BN,
        BigNumber,
    },

    enums: {
        NetworkTypeEnum,
        MerkleTreeNodeTypeEnum,
        RadixTreeNodeTypeEnum,
    },

    helpers: {
        Readline,
        Logger,
        BufferReader,
        StringHelper,
        Exception,
        ArrayHelper,
        BufferHelper,
        Helper,
        Base58,
        AsyncInterval,
        BansManager,
        EnumHelper,
        NumberHelper,

        crypto:{
            CryptoHelper,
            fcts: {
                keccak256,
                sha256,
            }
        },

        events:{
            Events,
            AsyncEvents,
        },

    },

    tests:{
        describe,
        describeList,
        TestsHelper,
        TestsFiles,
    }

};


if (typeof window !== "undefined") {
    window.library = library;
    window.PandoraPay = window.app = library.app;
    window.kernel = library;
}

if (typeof global !== "undefined"){
    global.library = library;
    global.PandoraPay = global.app = library.app;
    global.kernel = library;
}


module.exports = library;