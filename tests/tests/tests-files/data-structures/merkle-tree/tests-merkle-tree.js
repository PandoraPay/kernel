const describe = require('../../../unit-testing/describe');
const TestsHelper = require( "../../../unit-testing/tests-helper")
const MerkleTreeModel = require( "../../../../../src/data-structures/merkle-tree/merkle-tree-model")
const CryptoHelper = require( "../../../../../src/helpers/crypto/crypto-helper");

/**
 *
 * UNIT TESTING FOR Merkle Trees
 *
 */

module.exports = async function run () {

    const basicTest = async function (tree, data, length) {

        let newTree;

        // console.log(tree.root.hash().toString('hex') );

        tree.fillMerkleTree( data );

        let leaves = tree.leaves();
        this.expect( leaves.length, length );
        this.expect( leaves.reduce( (res, it, index) => res &&  it.data.equals( data[ index ] ), true), true);

        let BFS = tree.BFS, DFS = tree.DFS;
        this.expect( BFS.length , tree.totalNodes );
        this.expect( DFS.length , tree.totalNodes );

        this.expect( tree.validateMerkleTree(), true);

        this.expect( BFS.reduce( (res, it, index) => res &&  it.height === index, true), true);

        // console.log(tree.root.hash().toString('hex') );

        // for (let it of DFS) {
        //     console.log( 'data', it.data.toString("hex") );
        //     console.log( (it.children[0] ? it.children[0].hash().toString("hex") : "no left child")  );
        //     console.log( (it.children[1] ? it.children[1].hash().toString("hex") : "no right child")  );
        //     console.log(it.hash().toString("hex"), CryptoHelper.sha256(it.data.toString("hex") + (it.children[0] ? it.children[0].hash().toString("hex") : "") + (it.children[1] ? it.children[1].hash().toString("hex") : "")).toString("hex") );
        // }

        this.expect(  CryptoHelper.sha256( Buffer.concat([ tree.root.data, tree.root.children[0].hash(),  tree.root.children[1].hash() ] ) ), tree.hash() );

        this.expect( BFS.reduce( (res, it, index) => res &&  CryptoHelper.sha256( Buffer.concat( [ it.data, it.children[0] ? it.children[0].hash() : Buffer.alloc(0),  it.children[1] ? it.children[1].hash() : Buffer.alloc(0) ] ) ).equals( it.hash() ) ), true);

        if (length < 50) {
            await tree.save();

            const newTree4 = new MerkleTreeModel(this._scope);
            // console.log( newTree4.root.hash().toString('hex') );
            await newTree4.load(tree.id);
            // console.log( newTree4.root.hash().toString('hex') );

            this.expect(newTree4.root.children[0].hash(), tree.root.children[0].hash() );
            this.expect(newTree4.root.children[1].hash(), tree.root.children[1].hash() );
            this.expect(newTree4.root.hash(), tree.root.hash() );
        }

        //change one leaf

        let prevHash = tree.hash();
        data[5] = TestsHelper.randomBuffers(5, 0 );
        leaves[5].data = data[5];

        this.expect( prevHash.equals( tree.hash() ) , false);
        this.expect(  CryptoHelper.sha256( Buffer.concat( [ tree.root.data, tree.root.children[0].hash(), tree.root.children[1].hash() ] ) ), tree.hash() );
        this.expect( BFS.reduce( (res, it, index) => res &&  CryptoHelper.sha256( Buffer.concat( [ it.data, it.children[0] ? it.children[0].hash() : Buffer.alloc(0), it.children[1] ? it.children[1].hash() : Buffer.alloc(0) ] ) ).equals( it.hash() ) ), true);

        //change one random leaf

        prevHash = tree.hash();
        const index = Math.floor ( Math.random() *data.length );
        data[index] = TestsHelper.randomBuffers( 10, 0);
        leaves[index].data = data[index];

        this.expect( prevHash.equals( tree.hash() ) , false);
        this.expect(  CryptoHelper.sha256( Buffer.concat( [ tree.root.data, tree.root.children[0].hash(), tree.root.children[1].hash() ] ) ), tree.hash() );
        this.expect( BFS.reduce( (res, it, index) => res &&  CryptoHelper.sha256( Buffer.concat( [ it.data, it.children[0] ? it.children[0].hash() : Buffer.alloc(0), it.children[1] ? it.children[1].hash() : Buffer.alloc(0) ] ) ).equals( it.hash() ) ), true);

        let obj = tree.toObject();
        newTree = new MerkleTreeModel(this._scope);
        newTree.fromObject(obj);
        this.expect( tree.hash(), newTree.hash() );

        let buffer = tree.toBuffer();
        newTree = new MerkleTreeModel(this._scope);
        newTree.fromBuffer(buffer);
        this.expect( tree.hash(), newTree.hash() );

        leaves = tree.leaves();
        this.expect( leaves.length, length );
        this.expect( leaves.reduce( (res, it, index) => res &&  it.data.equals( data[ index ] ), true), true);

        BFS = newTree.BFS; DFS = newTree.DFS;
        this.expect( BFS.length , tree.totalNodes );
        this.expect( DFS.length , tree.totalNodes );

        this.expect( BFS.reduce( (res, it, index) => res &&  it.height === index, true), true );

        let callbackObject, prunedJSON;

        callbackObject = tree.createMarshalPruningLeavesCallback( [0, 1 ], true);
        prunedJSON = tree.toJSON( undefined, callbackObject );

        const tree2 = new MerkleTreeModel(this._scope);
        const callbackObject2 = tree2.createUnmarshalPruningLeavesCallback([0,1,], true);
        tree2.fromJSON( prunedJSON, callbackObject2 );

        this.expect( tree2.hash(), tree.hash() );

        callbackObject = tree.createMarshalPruningLeavesCallback( [0, 1, 2, 3, 4 ], true);
        prunedJSON = tree.toJSON( undefined, callbackObject );

        const tree3 = new MerkleTreeModel(this._scope);
        const callbackObject3 = tree2.createUnmarshalPruningLeavesCallback([0, 1, 2, 3, 4 ], true);
        tree3.fromJSON( prunedJSON, callbackObject3 );

        this.expect( tree3.hash(), tree.hash() );

    };

    describe("Merkle Trees tests", {

        'Merkle Tree 0-9 nodes': async function (){

            for (let length =0; length <= 9; length++){

                const tree = new MerkleTreeModel(this._scope);
                if (length){
                    const data = TestsHelper.fillBuffer( length );
                    tree.fillMerkleTree(data);
                }
                this.expect( tree.BFS.reduce( (res, it, index) => res &&  it.height === index, true), true);

                const tree2 = new MerkleTreeModel(this._scope);
                tree2.fromBuffer(tree.toBuffer());

                this.expect(tree.hash(), tree2.hash());
                this.expect(tree.count, tree2.count);
                this.expect( tree2.BFS.reduce( (res, it, index) => res &&  it.height === index, true), true);

                const tree3 = new MerkleTreeModel(this._scope);
                tree3.fromJSON(tree.toJSON(true));

                this.expect(tree.hash(), tree3.hash());
                this.expect(tree.count, tree3.count);
                this.expect( tree3.BFS.reduce( (res, it, index) => res &&  it.height === index, true), true);

            }

        },

        'Merkle Tree 12': async function () {
            
            const tree = new MerkleTreeModel(this._scope);

            const length = 12;
            const data = TestsHelper.fillBuffer( length );

            await basicTest.call(this, tree, data ,length);

        },

        'Merkle Tree 8': async function () {

            const tree = new MerkleTreeModel(this._scope);

            const length = 8;
            const data = TestsHelper.fillBuffer( length );

            await basicTest.call(this, tree, data ,length);

        },

        'Merkle Tree Random Length 10000': async function () {

            const tree = new MerkleTreeModel(this._scope);

            const length = TestsHelper.randomNumbers(10, 10000);
            const data = TestsHelper.fillBuffer( length );

            await basicTest.call(this, tree, data ,length);

        },

        'Merkle Tree Random Length and Random Data 1000': async function () {

            const tree = new MerkleTreeModel(this._scope);

            const length = TestsHelper.randomNumbers(10, 1000);
            const data = TestsHelper.randomBuffers( 10, length);

            await basicTest.call(this, tree, data ,length);

        },
        
    });

}
