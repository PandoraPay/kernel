const TestsRadixTree = require( "./tests-radix-tree")
const TestsRadixTreeRandom = require( "./tests-radix-tree-random")

/**
 *
 * UNIT TESTING FOR RADIX TREE
 *
 */

module.exports = async function run (scope) {

    await TestsRadixTree()
    await TestsRadixTreeRandom(scope.argv.dbPublic.selectedDB)

}
