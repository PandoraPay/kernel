const HashMapModel = require("../../../../../src/data-structures/hash-map/hash-map-model");
const HashVirtualMapModel = require( "../../../../../src/data-structures/hash-map/hash-virtual-map-model")

const TestsHashMap = require( "./tests-hash-map")

/**
 *
 * UNIT TESTING FOR HASH MAP
 *
 */

module.exports = async function run (scope) {

    const hashmap = new HashMapModel(scope);
    await TestsHashMap(hashmap, "", scope.argv.dbPublic.selectedDB);

    const hashmapVirtual = new HashVirtualMapModel(scope);
    await TestsHashMap(hashmapVirtual, "virtual", scope.argv.dbPublic.selectedDB);
}
