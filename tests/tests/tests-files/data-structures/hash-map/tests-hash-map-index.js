const HashMapDBModel = require("../../../../../src/data-structures/hash-map/hash-map-db-model");
const HashVirtualMapDBModel = require( "../../../../../src/data-structures/hash-map/hash-virtual-map-db-model")

const TestsHashMap = require( "./tests-hash-map")

/**
 *
 * UNIT TESTING FOR HASH MAP
 *
 */

module.exports = async function run (scope) {

    const hashmap = new HashMapDBModel(scope);
    await TestsHashMap(hashmap, "", scope.argv.dbPublic.selectedDB);

    const hashmapVirtual = new HashVirtualMapDBModel(scope);
    await TestsHashMap(hashmapVirtual, "virtual", scope.argv.dbPublic.selectedDB);
}
