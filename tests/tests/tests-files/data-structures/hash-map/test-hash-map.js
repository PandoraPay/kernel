import HashMap from "src/data-structures/hash-map/hash-map"
import TestsHashMap from "./tests-hash-map"

/**
 *
 * UNIT TESTING FOR HASH MAP
 *
 */

export default async function run (scope) {

    const hashmap = new HashMap(scope);

    await TestsHashMap(hashmap, "");

}
