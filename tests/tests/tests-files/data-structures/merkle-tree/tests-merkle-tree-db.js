const describe = require('../../../unit-testing/describe');
const TestsHelper = require( "../../../unit-testing/tests-helper")
const MerkleTreeModel = require( "../../../../../src/data-structures/merkle-tree/merkle-tree-model")

/**
 *
 * Merkel Tree
 *
 */

module.exports = async function run ( dbType) {

    describe(() => `${dbType} Testing Save Merkle Tree`, {

        "delete database for merkle trees": async function (){

            await this.db.client.destroy();

        },
        
        "Saving Merkle Tree 1": async function (){

            const tree = new MerkleTreeModel(this._scope);

            const length = 12;
            const data = TestsHelper.fillBuffer( length );

            tree.fillMerkleTree( data );
            
            await tree.save();

            const newTree = new MerkleTreeModel(this._scope);
            await newTree.load(tree.id);

            this.expect(newTree.hash(), tree.hash());

            const hex = newTree.toHex( );
            const json = newTree.toJSON(true);

            let BFS = newTree.BFS, DFS = newTree.DFS;
            this.expect( BFS.length , tree.totalNodes );
            this.expect( DFS.length , tree.totalNodes );

            const newTree2 = new MerkleTreeModel(this._scope);
            newTree2.fromHex(hex);

            const newTree3 = new MerkleTreeModel(this._scope);
            newTree3.fromJSON(json);

            this.expect(newTree2.hash(), tree.hash());
            this.expect(newTree3.hash(), tree.hash());

            this.expect( tree.toBuffer(), newTree2.toBuffer() );
            this.expect( tree.toBuffer(), newTree3.toBuffer() );

            const prunedTree = new MerkleTreeModel(this._scope );
            await prunedTree.loadPruningHeights( [4, 5], tree.id,  );

            BFS = prunedTree.BFS; DFS = prunedTree.DFS;
            this.expect( BFS.length , 12 );
            this.expect( DFS.length , 12 );

            this.expect( prunedTree.hash(), tree.hash());

        },

        "Saving Merkle Tree 2": async function (){

            const tree = new MerkleTreeModel(this._scope);

            const length = 1000;
            const data = TestsHelper.randomBuffers( 10, length);

            tree.fillMerkleTree( data );

            await tree.save();


            const newTree = new MerkleTreeModel(this._scope);
            await newTree.load(tree.id);

            this.expect(newTree.hash(), tree.hash());

            let BFS = newTree.BFS, DFS = newTree.DFS;
            this.expect( BFS.length , tree.totalNodes );
            this.expect( DFS.length , tree.totalNodes );

            this.expect( tree.BFS.reduce( (res, it, index) => res &&  it.data.equals( newTree.BFS[index].data  ), true), true);

            const pruning = TestsHelper.randomNumbers(0, 2 * length, Math.min(10, length) );

            const prunedTree = new MerkleTreeModel(this._scope );
            await prunedTree.loadPruningHeights( pruning, tree.id,  );

            this.expect( prunedTree.hash(), tree.hash() );

            BFS = prunedTree.BFS; DFS = prunedTree.DFS;
            this.expect( BFS.length , DFS.length);
            this.expect( BFS.length > 0, true );
            //TODO calculate number of elements
            // this.expect( BFS.length <= 2*length - pruning.length , true );
            // this.expect( DFS.length <= 2*length - pruning.length, true );

        }

    });

}


