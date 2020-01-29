import BN from 'bn.js';
import BigNumber from "bignumber.js";

import AsyncEvents from "async-events";
import BufferReader from "src/helpers/buffers/buffer-reader";

import Logger from "src/helpers/logger/logger";
import Readline from "src/helpers/readline/readline";
import StringHelper from "src/helpers/string-helper";
import Exception from "src/helpers/exception";
import ArrayHelper from "src/helpers/array-helper";
import BufferHelper from "src/helpers/buffers/buffer-helper";
import Helper from "src/helpers/helper";
import CryptoHelper from "src/helpers/crypto/crypto-helper";
import Base58 from "src/helpers/base58-helper";
import Events from "src/helpers/events/events";

import Argv from "./bin/argv/argv";
import App from 'src/app';

import Marshal from "src/marshal/marshal";
import MarshalData from "src/marshal/data/marshal-data";

import DBSchema from "src/db/db-generic/db-schema";
import DBSchemaBuffer from "src/db/db-generic/samples/db-schema-buffer";
import DBSchemaBufferBig from "src/db/db-generic/samples/db-schema-buffer-big";
import DBSchemaBufferUnique from "src/db/db-generic/samples/db-schema-buffer-unique";
import DBSchemaNumber from "src/db/db-generic/samples/db-schema-number";
import DBSchemaHash from "src/db/db-generic/samples/db-schema-hash";
import DBSchemaString from "src/db/db-generic/samples/db-schema-string";
import DBSchemaBoolean from "src/db/db-generic/samples/db-schema-boolean";

import ClientsCluster from "src/cluster/clients/clients-cluster";
import DBSchemaHelper from "src/db/db-generic/db-schema-helper";
import DBConstructor from "src/db/db-constructor";

import * as AsyncInterval from "src/helpers/async-interval";

import { keccak256 } from 'js-sha3';

import describe from 'tests/tests/unit-testing/describe';
import describeList from 'tests/tests/unit-testing/describe-list';
import TestsHelper from "tests/tests/unit-testing/tests-helper";

import TestsFiles from "tests/tests/tests-index";

import MerkleTree from "src/data-structures/merkle-tree/merkle-tree";
import MerkleTreeNode from "src/data-structures/merkle-tree/merkle-tree-node";
import MerkleTreeNodeTypeEnum from "src/data-structures/merkle-tree/merkle-tree-node-type-enum";
import MerkleTreeRoot from "src/data-structures/merkle-tree/merkle-tree-root";

import RadixTree from "src/data-structures/radix-tree/radix-tree";
import RadixTreeVirtual3 from "src/data-structures/radix-tree/radix-tree-virtual3";
import RadixTreeVirtual from "src/data-structures/radix-tree/radix-tree-virtual";
import RadixTreeNode from "src/data-structures/radix-tree/radix-tree-node";
import RadixTreeRoot from "src/data-structures/radix-tree/radix-tree-root";
import RadixTreeNodeTypeEnum from "src/data-structures/radix-tree/radix-tree-node-type-enum";

import HashMap from "src/data-structures/hash-map/hash-map";
import HashVirtualMap from "src/data-structures/hash-map/hash-virtual-map";
import HashMapElement from "src/data-structures/hash-map/hash-map-element";

import NetworkTypeEnum from "./bin/argv/modules/network-type-enum";

import HeartBeat from "src/heart-beat/heart-beat";
import BansManager from "src/helpers/bans-manager/bans-manager";
import EnumHelper from "src/helpers/enum-helper";
import NumberHelper from "src/helpers/number-helper";

import MasterCluster from "src/cluster/master-cluster";
import BrowserCluster from "src/cluster/browser-cluster";

// only supported for node.js
const sticky = BROWSER ? undefined : require('sticky-session').default;
const HttpServer = BROWSER ? undefined : require("src/cluster/server/http-server").default;
const ServerCluster = BROWSER ? undefined : require("src/cluster/server/server-cluster").default;
const RedisDB = BROWSER ? undefined : require( "src/db/redis-db/redis-db" ).default;

const library = {

    app: new App({}),

    marshal:{

        Marshal,
        MarshalData,

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

export default library;