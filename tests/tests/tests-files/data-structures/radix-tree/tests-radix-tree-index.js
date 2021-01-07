import TestsRadixTree from "./tests-radix-tree"
import TestsRadixTreeRandom from "./tests-radix-tree-random"

/**
 *
 * UNIT TESTING FOR RADIX TREE
 *
 */

export default async function run (scope) {

    await TestsRadixTree()
    await TestsRadixTreeRandom(scope.argv.dbPublic.selectedDB)

}
