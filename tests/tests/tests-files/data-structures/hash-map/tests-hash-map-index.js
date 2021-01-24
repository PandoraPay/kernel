const HashMap = require.main.require("./src/data-structures/hash-map/hash-map");
const HashVirtualMap = require.main.require( "./src/data-structures/hash-map/hash-virtual-map")

const TestsHashMap = require( "./tests-hash-map")

/**
 *
 * UNIT TESTING FOR HASH MAP
 *
 */

module.exports = async function run (scope) {

    const hashmap = new HashMap(scope);
    await TestsHashMap(hashmap, "", scope.argv.dbPublic.selectedDB);

    const hashmapVirtual = new HashVirtualMap(scope);
    await TestsHashMap(hashmapVirtual, "virtual", scope.argv.dbPublic.selectedDB);
}
