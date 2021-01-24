const describe = require( '../../../unit-testing/describe');
const TestsHelper = require( "../../../unit-testing/tests-helper")
const RadixTree = require( "../../../../../src/data-structures/radix-tree/radix-tree")
const MarshalData = require( "../../../../../src/marshal/data/marshal-data")
const RadixTreeVirtual = require( "../../../../../src/data-structures/radix-tree/radix-tree-virtual");

/**
 *
 * UNIT TESTING FOR RADIX
 *
 */

module.exports = async function run (selectedDB) {

    const randomCount = selectedDB === 'couch' ? 200 : 3000;

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