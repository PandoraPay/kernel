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

const Marshal = require( "./src/marshal/marshal");
const MarshalData = require( "./src/marshal/data/marshal-data");
const MarshalFields = require( "./src/marshal/fields/marshal-fields");
const MarshalValidation = require( "./src/marshal/fields/marshal-validation");
const UnmarshalFields = require( "./src/marshal/fields/unmarshal-fields");
const MarshalValidationPreProcessing = require( "./src/marshal/fields/marshal-validation-pre-processing");
const MarshalValidationPreset = require( "./src/marshal/fields/marshal-validation-pre-set");

const DBSchema = require( "./src/db/db-generic/db-schema");
const DBSchemaBuffer = require( "./src/db/db-generic/samples/db-schema-buffer");
const DBSchemaBufferBig = require( "./src/db/db-generic/samples/db-schema-buffer-big");
const DBSchemaBufferUnique = require( "./src/db/db-generic/samples/db-schema-buffer-unique");
const DBSchemaNumber = require( "./src/db/db-generic/samples/db-schema-number");
const DBSchemaHash = require( "./src/db/db-generic/samples/db-schema-hash");
const DBSchemaString = require( "./src/db/db-generic/samples/db-schema-string");
const DBSchemaBoolean = require( "./src/db/db-generic/samples/db-schema-boolean");

const ClientsCluster = require( "./src/cluster/clients/clients-cluster");
const DBSchemaHelper = require( "./src/db/db-generic/db-schema-helper");
const DBConstructor = require( "./src/db/db-constructor");

const AsyncInterval = require( "./src/helpers/async-interval");

const describe = require( './tests/tests/unit-testing/describe');
const describeList = require( './tests/tests/unit-testing/describe-list');
const TestsHelper = require( "./tests/tests/unit-testing/tests-helper");

const TestsFiles = require( "./tests/tests/tests-index");

const MerkleTree = require( "./src/data-structures/merkle-tree/merkle-tree");
const MerkleTreeNode = require( "./src/data-structures/merkle-tree/merkle-tree-node");
const MerkleTreeNodeTypeEnum = require( "./src/data-structures/merkle-tree/merkle-tree-node-type-enum");
const MerkleTreeRoot = require( "./src/data-structures/merkle-tree/merkle-tree-root");

const RadixTree = require( "./src/data-structures/radix-tree/radix-tree");
const RadixTreeVirtual3 = require( "./src/data-structures/radix-tree/radix-tree-virtual3");
const RadixTreeVirtual = require( "./src/data-structures/radix-tree/radix-tree-virtual");
const RadixTreeNode = require( "./src/data-structures/radix-tree/radix-tree-node");
const RadixTreeRoot = require( "./src/data-structures/radix-tree/radix-tree-root");
const RadixTreeNodeTypeEnum = require( "./src/data-structures/radix-tree/radix-tree-node-type-enum");

const HashMap = require( "./src/data-structures/hash-map/hash-map");
const HashVirtualMap = require( "./src/data-structures/hash-map/hash-virtual-map");
const HashMapElement = require( "./src/data-structures/hash-map/hash-map-element");

const NetworkTypeEnum = require( "./bin/argv/modules/network-type-enum");

const HeartBeat = require( "./src/heart-beat/heart-beat");
const BansManager = require( "./src/helpers/bans-manager/bans-manager");
const EnumHelper = require( "./src/helpers/enum-helper");
const NumberHelper = require( "./src/helpers/number-helper");

const MasterCluster = require( "./src/cluster/master-cluster");
const BrowserCluster = require( "./src/cluster/browser-cluster");

// only supported for node.js
const sticky = BROWSER ? undefined : require('sticky-session').default;
const HttpServer = BROWSER ? undefined : require("./src/cluster/server/http-server");
const ServerCluster = BROWSER ? undefined : require("./src/cluster/server/server-cluster");
const RedisDB = BROWSER ? undefined : require( "./src/db/redis-db/redis-db" );

const library = {

    app: new App({}),

    marshal:{

        Marshal,
        MarshalData,
        MarshalFields,
        MarshalValidation,
        UnmarshalFields,
        MarshalValidationPreset,
        MarshalValidationPreProcessing,

        db:{
            DBSchema,
            RedisDB,

            samples:{
                DBSchemaBuffer,
                DBSchemaBufferUnique,
                DBSchemaBufferBig,
                DBSchemaHash,
                DBSchemaNumber,
                DBSchemaString,
                DBSchemaBoolean,
            },

            DBSchemaHelper,
            DBConstructor,

        },
    },

    dataStructures: {

        merkleTree:{
            MerkleTree,
            MerkleTreeNode,
            MerkleTreeRoot,
            MerkleTreeNodeTypeEnum
        },

        radixTree:{
            RadixTree,
            RadixTreeVirtual3,
            RadixTreeVirtual,
            RadixTreeNode,
            RadixTreeRoot,
            RadixTreeNodeTypeEnum,
        },

        hashMap:{
            HashMap,
            HashVirtualMap,
            HashMapElement,
        }

    },


    masterCluster: {
        MasterCluster,
        BrowserCluster,
        ServerCluster,
        ClientsCluster,
        HttpServer,

        sticky,
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