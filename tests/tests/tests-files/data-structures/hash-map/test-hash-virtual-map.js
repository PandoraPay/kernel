import HashVirtualMap from "src/data-structures/hash-map/hash-virtual-map"
import TestsHashMap from "./tests-hash-map"

/**
 *
 * UNIT TESTING FOR HASH VIRTUAL MAP
 *
 */

export default async function run (scope) {

    const hashmap = new HashVirtualMap(scope);

    await TestsHashMap(hashmap, "virtual");

}
