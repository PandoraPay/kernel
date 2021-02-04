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
const BufferSchemaBuild = require( "./src/db/db-generic/schemas/samples/buffer-schema-build");
const BufferUniqueSchemaBuild = require( "./src/db/db-generic/schemas/samples/buffer-unique-schema-build");
const NumberSchemaBuild = require( "./src/db/db-generic/schemas/samples/number-schema-build");
const StringSchemaBuild = require( "./src/db/db-generic/schemas/samples/string-schema-build");

const ClientsCluster = require( "./src/cluster/clients/clients-cluster");
const DBModelHelper = require( "./src/db/db-generic/db-model-helper");
const DBConstructor = require( "./src/db/db-constructor");

const AsyncInterval = require( "./src/helpers/async-interval");

const describe = require( './tests/tests/unit-testing/describe');
const describeList = require( './tests/tests/unit-testing/describe-list');
const TestsHelper = require( "./tests/tests/unit-testing/tests-helper");

const TestsFiles = require( "./tests/tests/tests-index");

const MerkleTreeModel = require( "./src/data-structures/merkle-tree/merkle-tree-model");
const MerkleTreeNodeModel = require( "./src/data-structures/merkle-tree/merkle-tree-node-model");
const MerkleTreeNodeTypeEnum = require( "./src/data-structures/merkle-tree/merkle-tree-node-type-enum");
const MerkleTreeRootModel = require( "./src/data-structures/merkle-tree/merkle-tree-root-model");
const MerkleTreeRootSchemaBuild = require( "./src/data-structures/merkle-tree/schema/merkle-tree-root-schema-build");
const MerkleTreeNodeSchemaBuild = require( "./src/data-structures/merkle-tree/schema/merkle-tree-node-schema-build");
const MerkleTreeSchemaBuild = require( "./src/data-structures/merkle-tree/schema/merkle-tree-schema-build");

const RadixTree = require( "./src/data-structures/radix-tree/radix-tree-model");
const RadixTreeVirtual3Model = require( "./src/data-structures/radix-tree/radix-tree-virtual3-model");
const RadixTreeVirtualModel = require( "./src/data-structures/radix-tree/radix-tree-virtual-model");
const RadixTreeNodeModel = require( "./src/data-structures/radix-tree/radix-tree-node-model");
const RadixTreeRootModel = require( "./src/data-structures/radix-tree/radix-tree-root-model");
const RadixTreeNodeTypeEnum = require( "./src/data-structures/radix-tree/radix-tree-node-type-enum");
const RadixTreeRootSchemaBuild = require( "./src/data-structures/radix-tree/schema/radix-tree-root-db-schema-build");
const RadixTreeSchemaBuild = require( "./src/data-structures/radix-tree/schema/radix-tree-schema-build");
const RadixTreeNodeSchemaBuild = require( "./src/data-structures/radix-tree/schema/radix-tree-node-db-schema-build");

const HashMapModel = require( "./src/data-structures/hash-map/hash-map-model");
const HashVirtualMapModel = require( "./src/data-structures/hash-map/hash-virtual-map-model");
const HashMapElementSchemaBuild = require( "./src/data-structures/hash-map/schema/hash-map-element-schema-build");

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
        BufferSchemaBuild,
        StringSchemaBuild,
        NumberSchemaBuild,
        BufferUniqueSchemaBuild,
    },

    dataStructures: {

        merkleTree:{
            MerkleTreeModel,
            MerkleTreeNodeModel,
            MerkleTreeRootModel,
            MerkleTreeNodeTypeEnum,
            schema:{
                MerkleTreeRootSchemaBuild,
                MerkleTreeSchemaBuild,
                MerkleTreeNodeSchemaBuild,
            }
        },

        radixTree:{
            RadixTree,
            RadixTreeVirtual3Model,
            RadixTreeVirtualModel,
            RadixTreeNodeModel,
            RadixTreeRootModel,
            RadixTreeNodeTypeEnum,
            schema:{
                RadixTreeRootSchemaBuild,
                RadixTreeSchemaBuild,
                RadixTreeNodeSchemaBuild,
            },
        },

        hashMap:{
            HashMapModel,
            HashVirtualMapModel,
            schema:{
                HashMapElementSchemaBuild
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