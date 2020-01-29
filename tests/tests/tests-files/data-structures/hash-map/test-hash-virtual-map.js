import HashVirtualMap from "src/data-structures/hash-map/hash-virtual-map"
import TestsHashMap from "./tests-hash-map"

/**
 *
 * UNIT TESTING FOR REDIS
 *
 */

export default async function run (scope) {

    const hashmap = new HashVirtualMap(scope);

    await TestsHashMap(hashmap, "virtual");

}
