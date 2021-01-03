import describe from 'tests/tests/unit-testing/describe';
import TestsHelper from "tests/tests/unit-testing/tests-helper"
import RadixTree from "src/data-structures/radix-tree/radix-tree"
import RadixTreeVirtual3 from "src/data-structures/radix-tree/radix-tree-virtual3"
import Helper from "src/helpers/helper"
import MarshalData from "src/marshal/data/marshal-data"
import RadixTreeVirtual from "src/data-structures/radix-tree/radix-tree-virtual";

/**
 *
 * UNIT TESTING FOR RADIX
 *
 */

export default async function run () {

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

            let tree = new RadixTreeVirtual(this._scope);
            await tree.clearTree();

            for (let i=0; i < radixTest.length; i++){

                const label = radixTest[i];
                const data = Buffer.from([i]);

                await tree.addRadix(label, data );

                tree.validateVirtualMap();

                const find = await tree.findRadix( label );
                this.expect(find.result, true);

                let find2 = await tree.findRadixLeaf(label);
                this.expect( !!find2, true);
            }
            tree.validateVirtualMap();

            await tree.saveTree();

            tree = new RadixTreeVirtual(this._scope);
            for (const label of radixTest){

                const find = await tree.findRadix( label );
                this.expect(find.result, true);

                let find2 = await tree.findRadixLeaf(label);
                this.expect( !!find2, true);
            }
            tree.validateVirtualMap();

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

    const randomCount = 3000;

    const randomLabels = TestsHelper.randomBuffers( 20, randomCount ).map( it => it.toString("hex") );

    const randomData = [];
    for (let i=0; i < randomCount; i++)
        randomData.push( MarshalData.marshalNumber(i) );

    let randomDatum = [];
    for (let i=0; i < randomLabels.length; i++)
        randomDatum.push({
            label: randomLabels[i],
            data: randomData[i],
        });

    let randomDataDeleted = {};

    describe("Radix Test Random "+ randomCount, {

        'Radix Tree random add one by one 1/20 of nodes': async function () {

            let tree = new RadixTree(this._scope);

            await tree.clearTree();

            for (let i=0; i < randomLabels.length / 20; i++)
                await tree.addRadix( randomLabels[i], MarshalData.marshalNumber(i) );

        },

        'Radix Tree random add ALL VIRTUAL': async function () {

            const tree = new RadixTreeVirtual(this._scope);
            await tree.clearTree();

            for (const it of randomDatum) {

                await tree.addRadix(it.label, it.data);

                let find = await tree.findRadix( it.label );
                this.expect( !!find, true );
                this.expect( find.node.data, it.data );

                find = await tree.findRadixLeaf( it.label );
                this.expect( !!find, true );
                this.expect( find.data, it.data );
            }

            tree.validateVirtualMap();

            await tree.saveTree();

        },

        'Radix Tree random findRadixLeaf': async function () {

            const tree = new RadixTree(this._scope);

            for (let i=0; i < randomData.length; i++){

                let find = await tree.findRadixLeaf( randomLabels[i] );
                this.expect( !!find, true );
                this.expect( find.data, MarshalData.marshalNumber(i) );

            }

        },

        'Radix Tree random findRadixLeaf VIRTUAL': async function () {

            const tree = new RadixTreeVirtual(this._scope);

            randomDataDeleted = {};

            for (let i=0; i < randomData.length; i++){

                let del = Math.floor( Math.random( ) * randomLabels.length );
                while ( randomDataDeleted[ del ])
                    del = Math.floor( Math.random( ) * randomLabels.length );

                randomDataDeleted[del] = true;

                try{
                    await tree.deleteRadix( randomLabels[del] );

                    tree.validateVirtualMap();
                }catch(err){
                    console.log("i", i);
                    throw err;
                }

                let find = await tree.findRadixLeaf( randomLabels[del] );
                this.expect( find, undefined );

            }

            tree.validateVirtualMap();

            for (let i=0; i < randomData.length; i++){
                let find = await tree.findRadixLeaf( randomLabels[i] );
                this.expect( find, undefined );
            }

            await tree.saveTree();

        },

        'Radix Tree should be empty': async function () {

            const tree = new RadixTree(this._scope);

            for (let i=0; i < randomData.length; i++){
                let find = await tree.findRadixLeaf( randomLabels[i] );
                this.expect( find, undefined );
            }

        },

        'Radix Tree random delete one by one 1/10 of nodes with 3 search algorithms': async function () {

            randomDataDeleted = {};

            const tree = new RadixTree(this._scope);

            for (let i=0; i < randomLabels.length / 10; i++){

                let del = Math.floor( Math.random( ) * randomLabels.length );
                while ( randomDataDeleted[ del ])
                    del = Math.floor( Math.random( ) * randomLabels.length );

                randomDataDeleted[del] = true;

                await tree.deleteRadix( randomLabels[del] );

                const find1 = await tree.findRadix(randomLabels[del] );
                this.expect( find1.result, false );

                const find2 = await tree.findRadixLeaf(randomLabels[del] );
                this.expect( !!find2, false );

                const tree2 = new RadixTree(this._scope);
                const find3 = await tree2.findRadix(randomLabels[del] );
                this.expect( find3.result, false );

            }

        },

        'Radix Tree add ALL VIRTUAL2': async function () {


            const tree = new RadixTreeVirtual(this._scope);
            await tree.clearTree();

            for (const it of randomDatum)
                await tree.addRadix( it.label, it.data );

            tree.validateVirtualMap();

            await tree.saveTree();

        },

        'Radix Tree random delete ALL VIRTUAL2': async function () {

            const tree = new RadixTreeVirtual(this._scope);

            for (let i=0; i < randomDatum.length; i++){

                const it = randomDatum[i];

                const find1 = await tree.findRadix( it.label );
                this.expect( find1.result, true );

                const find2 = await tree.findRadixLeaf( it.label );
                this.expect( !!find2, true );

                const out = await tree.deleteRadix(it.label);
                this.expect( !!out, true );

                const find21 = await tree.findRadix( it.label );
                this.expect( find21.result, false );

                const find22 = await tree.findRadixLeaf( it.label );
                this.expect( !!find22, false );

            }

            tree.validateVirtualMap();

            await tree.saveTree();

        }


    })

}
