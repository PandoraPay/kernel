const describe = require('../../../unit-testing/describe');
const TestsHelper = require("../../../unit-testing/tests-helper");

const DBModel = require("../../../../../src/db/db-generic/db-model");
const {HashMapElementSchemaBuild} = require("../../../../../src/data-structures/hash-map/schema/hash-map-element-schema-build");

/**
 *
 * UNIT TESTING FOR HASH MAP
 *
 */

module.exports = async function run (hashmap, name, selectedDB) {

    const  count = selectedDB ===  "couch" ? 500 : 10000;
    const ids = TestsHelper.randomBuffers( 32, count).map( id => id.toString("hex") );
    const data = TestsHelper.randomBuffers( 10, count);
    const newData = TestsHelper.randomBuffers( 10, count);

    describe(`Test Hash Map ${name} ${count}`, {

        'Test Hash Map Add': async function () {

            for (let i=0; i < count; i++){
                const element = await hashmap.addMap ( ids[i], {data: data[i] } );
                this.expect( element instanceof DBModel, true );
                this.expect( element._schema instanceof HashMapElementSchemaBuild, true );
                this.expect( element.data, data[i] );
            }

        },

        'Test Hash Map Add identical': async function () {

            for (let i=0; i < count; i++)
                this.expectError( hashmap.addMap ( ids[i], {data: data[i] } ));


        },

        'Test Hash Map Verify': async function () {

            for (let i=0; i < count; i++) {
                const element = await hashmap.getMap ( ids[i] );
                this.expect( element instanceof DBModel, true );
                this.expect( element._schema instanceof HashMapElementSchemaBuild, true );
                this.expect( element.data, data[i] );
            }

        },

        'Test Hash Map Verify All': async function () {

            let promises = [];
            for (let i=0; i < count; i++)
                promises.push ( hashmap.getMap ( ids[i] ) );

            promises = await Promise.all(promises);

            for (let i=0; i < count; i++){
                const element = promises[i];
                this.expect( element instanceof DBModel, true );
                this.expect( element._schema instanceof HashMapElementSchemaBuild, true );
                this.expect( element.data, data[i] );
            }

        },

        'Test Hash Map Update All ': async function () {

            let promises = [];
            for (let i=0; i < count; i++)
                promises.push ( hashmap.updateMap ( ids[i], {data: newData[i] } ) );

            promises = await Promise.all(promises);

            for (let i=0; i < count; i++) {
                const element = promises[i];
                this.expect( element instanceof DBModel, true );
                this.expect( element._schema instanceof HashMapElementSchemaBuild, true );
                this.expect( element.data, newData[i] );
            }

        },

        'Test Hash Map Verify Update': async function () {

            for (let i=0; i < count; i++) {
                const element = await hashmap.getMap ( ids[i] );
                this.expect( element instanceof DBModel, true );
                this.expect( element._schema instanceof HashMapElementSchemaBuild, true );
                this.expect( element.data, newData[i] );
            }

        },

        'Test Hash Map Delete': async function () {

            for (let i=0; i < count; i++) {

                const deleted = await hashmap.deleteMap ( ids[i] );
                this.expect( deleted , ids[i]);

            }

        },

        'Test Hash Map Delete again': async function () {

            for (let i=0; i < count; i++)
                this.expectError( hashmap.getMap ( ids[i] ) );

        },

        'Test Hash Map clearHashMap - step 1 ADD': async function () {

            const results = await Promise.all(  ids.map( (it, index) => hashmap.addMap ( it, {data: data[index] } )) );
            await Promise.all(  results.map (it => this.expect( it instanceof DBModel && it._schema instanceof HashMapElementSchemaBuild, true)));

        },

        'Test Hash Map clearHashMap - step 2 CLEAR': async function () {

            await hashmap.clearHashMap();

        },

        'Test Hash Map clearHashMap - step 3 getMap': async function (){

            for (let i=0; i < count; i++)
                this.expectError( hashmap.getMap ( ids[i] ) );
        }


    });

}
