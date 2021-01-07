import HashMap from "src/data-structures/hash-map/hash-map"
import HashVirtualMap from "src/data-structures/hash-map/hash-virtual-map"

import TestsHashMap from "./tests-hash-map"

/**
 *
 * UNIT TESTING FOR HASH MAP
 *
 */

export default async function run (scope) {

    const hashmap = new HashMap(scope);
    await TestsHashMap(hashmap, "", scope.argv.dbPublic.selectedDB);

    const hashmapVirtual = new HashVirtualMap(scope);
    await TestsHashMap(hashmapVirtual, "virtual", scope.argv.dbPublic.selectedDB);
}
