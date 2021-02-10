const describe = require( '../../../unit-testing/describe');
const TestsHelper = require( "../../../unit-testing/tests-helper")
const RadixTree = require( "../../../../../src/data-structures/radix-tree/radix-tree-model")
const RadixTreeVirtualModel = require( "../../../../../src/data-structures/radix-tree/radix-tree-virtual-model");

/**
 *
 * UNIT TESTING FOR RADIX
 *
 */

module.exports = async function run () {

    const radixTestDemo = [ "romane", "romanus", "romulus", "rubens", "ruber","rubicon","rubicundus", "rubicundo", "rubicundua"];
    let radixTest = radixTestDemo.slice(0);

    radixTest = radixTest.map( it => Buffer.from(it, "ascii") );
    radixTest = radixTest.map( it => Buffer.concat( [ it, Buffer.alloc(20 - it.length) ] ).toString("hex") );

    const radixDatum = [];
    for (let i=0; i < radixTest.length; i++)
        radixDatum.push({
            label: radixTest[i],
            data: Buffer.from([i]),
        });

    describe(`Radix Test ${radixTest.length}`, {

        "Radix Delete all prev data": async function (){

            const tree = new RadixTree(this._scope);
            await tree.clearTree( );

        },

        'RadixTree wikipedia': async function () {

            const tree = new RadixTree(this._scope);

            for (let i=0; i < radixTest.length; i++){


                const label = radixTest[i];
                const data = Buffer.from([i]);

                await tree.addRadix(label, data );

                const tree2 = new RadixTree(this._scope);

                const find = await tree.findRadix( label );
                this.expect(find.result, true);
                this.expect(find.node.data, data);
                this.expect(find.node.labelComplete(), label);

                const find2 = await tree2.findRadix( label);
                this.expect(find2.result, true);
                this.expect(find2.node.data, data);
                this.expect(find2.node.labelComplete(), label);

                for (let j=0; j < i; j++){

                    const treeNew = new RadixTree(this._scope);

                    let find = await treeNew.findRadix( radixTest[j] );

                    this.expect( find.result, true );
                    this.expect( find.node.data, Buffer.from([j]));
                    this.expect( find.node.labelComplete(), radixTest[j] );
                }

            }

        },

        'RadixTree wikipedia delete specific order': async function () {

            const deletes = [ "romulus", "romanus", "romane", "rubens", "ruber", "rubicon", "rubicundus", "rubicundo", "rubicundua"];
            const deleteOrder = deletes.map( it => radixTestDemo.indexOf( it ) );

            for (let i=0; i < deleteOrder.length; i++){

                const newTree = new RadixTree(this._scope);

                let find = await newTree.findRadix( radixTest[ deleteOrder[i] ] );
                this.expect( find.result, true );

                let deleted = await newTree.deleteRadix( radixTest[ deleteOrder[i] ] );
                this.expect( !!deleted, true  );

                find = await newTree.findRadix( radixTest[ deleteOrder[i] ] );
                this.expect( find.result, false );

                const newTree2 = new RadixTree(this._scope);

                find = await newTree2.findRadix( radixTest[ deleteOrder[i] ] );
                this.expect( find.result, false );

            }

        },

        'RadixTree wikipedia Virtual - add & check': async function () {

            let tree = new RadixTreeVirtualModel(this._scope);
            await tree.clearTree();

            for (let i=0; i < radixTest.length; i++){

                const label = radixTest[i];
                const data = Buffer.from([i]);

                await tree.addRadix(label, data );

                const find = await tree.findRadix( label );
                this.expect(find.result, true);

                let find2 = await tree.findRadixLeaf(label);
                this.expect( !!find2, true);
            }

            await tree.saveTree();

            tree = new RadixTreeVirtualModel(this._scope);
            for (const label of radixTest){

                const find = await tree.findRadix( label );
                this.expect(find.result, true);

                let find2 = await tree.findRadixLeaf(label);
                this.expect( !!find2, true);
            }

            tree = new RadixTree(this._scope);
            for (const label of radixTest){

                const find = await tree.findRadix( label );
                this.expect(find.result, true);

                let find2 = await tree.findRadixLeaf( label );
                this.expect( !!find2, true);
            }

        },

        "RadixTree wikipedia clearTree & check": async function (){

            const tree = new RadixTree(this._scope);
            await tree.clearTree();

            for (const label of radixTest){

                const find = await tree.findRadix( label );
                this.expect(find.result, false);

                let find2 = await tree.findRadixLeaf( label );
                this.expect( !!find2, false);
            }


            for (const it of radixDatum)
                await tree.addRadix( it.label, it.data );

            const tree2 = new RadixTree(this._scope);
            const out = await tree2.clearTree();

            const tree3 = new RadixTree(this._scope);

            for (const it of radixDatum){

                let find = await tree3.findRadix(it.label);
                this.expect(find.result, false );

                let find2 = await tree3.findRadixLeaf(it.label);
                this.expect(find2, undefined );

            }

            await tree3.saveTree();

        },

        "RadixTree wikipedia Delete all create ALL again ": async function (){

            const tree = new RadixTree(this._scope);
            await tree.clearTree();

            for (const it of radixDatum)
                await tree.addRadix( it.label, it.data );

            await tree.saveTree();

        },

        'Radix Tree wikipedia delete random': async function () {

            const tree = new RadixTree(this._scope);

            const deleted = {};

            for (let i = 0; i < radixTest.length; i++) {

                for (let j = 0; j < radixTest.length; j++) {

                    let find = await tree.findRadix(radixTest[j]);

                    this.expect(find.result, !deleted[j]);

                    if (!deleted[j]) {
                        this.expect(find.node.data, Buffer.from([j]));
                        this.expect(find.node.labelComplete(), radixTest[j]);
                    }

                }

                let del = Math.floor(Math.random() * radixTest.length);
                while (deleted[del])
                    del = Math.floor(Math.random() * radixTest.length);

                deleted[del] = true;

                await tree.deleteRadix(radixTest[del]);

                const find = await tree.findRadix(radixTest[del]);
                this.expect(find.result, false);

                const tree2 = new RadixTree(this._scope);

                const find2 = await tree2.findRadix(radixTest[del]);
                this.expect(find2.result, false);


            }

        },

        "RadixTree wikipedia Delete all create ALL": async function (){

            const tree = new RadixTree(this._scope);

            for (const it of radixDatum)
                await tree.addRadix( it.label, it.data );

            await tree.saveTree();

        },

        'Radix Tree wikipedia delete ALL': async function () {

            const tree = new RadixTree(this._scope);

            for (const it of radixDatum)
                await tree.deleteRadix( it.label );

            for (const it of radixDatum) {
                let find = await tree.findRadix(it.label);
                this.expect(find.result, false);


                find = await tree.findRadixLeaf( it.label );
                this.expect( !!find, false );
            }

            await tree.saveTree();

        },


    });


}
