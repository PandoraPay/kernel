import describe from 'tests/tests/unit-testing/describe';
import {asyncTimeout} from "src/helpers/async-interval"

export default function run () {

    describe("Simple test 1", {

        '1 === 1': async function () {
            this.expect(42, 42);
        },

    });

    describe("Simple Test 2", {

        'async test 1': async function ()  {

            const promise = await asyncTimeout( () => 5+3, 200 );

            await this.expect( promise, 8 );

        },

    });

    describe("Simple test 3", {

        'MAX_SAFE_INTEGER - MAX_SAFE_INTEGER === 0': function () {
            this.expect( Number.MAX_SAFE_INTEGER - Number.MAX_SAFE_INTEGER, 0);
        },

    });

}