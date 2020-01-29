import describe from 'tests/tests/unit-testing/describe';
import MarshalData from "src/marshal/data/marshal-data";
import MarshalValidationPreSet from "src/marshal/fields/marshal-validation-pre-set"

import BN from 'bn.js';
import TestsHelper from "tests/tests/unit-testing/tests-helper";
import BufferReader from "src/helpers/buffers/buffer-reader";

/**
 *
 * UNIT TESTING FOR Marshal / Unmarshal
 *
 */

export default function run () {

    describe("Marshal Data", {

        'marshal strings': async function () {

            this.expect( MarshalData.compressString("HELLO WORLD"), Buffer.from("HELLO WORLD", "ascii") );
            this.expect( MarshalData.decompressString( MarshalData.compressString("HELLO WORLD") ), "HELLO WORLD" );

        },

        // need to be fixed
        // 'marshal buffers': async function () {
        //
        //     const buffer = MarshalValidationPreSet.preset_buffer( Buffer.concat([ Buffer.from("000003344888", "hex"), Buffer.alloc(10)]) , { } );
        //     this.expect( MarshalData.marshalBuffer( buffer, undefined, true, true), Buffer.from("020403344888", "hex") );
        //     this.expect( MarshalData.unmarshalBuffer( BufferReader.create( MarshalData.marshalBuffer( buffer, undefined, true, true)), undefined, true, true), Buffer.from("000003344888", "hex") );
        //
        // },

        'marshal varint': async function () {

            this.expect( MarshalData.marshalNumber(5 ), Buffer.from("05", "hex") );
            this.expect( MarshalData.marshalNumber(120 ), Buffer.from("78", "hex") );
            this.expect( MarshalData.marshalNumber(225 ), Buffer.from("E101","hex") );
            this.expect( MarshalData.marshalNumber(850 ), Buffer.from("D206","hex") );

        },

        'marshal varint random': async function () {

            const numbers = TestsHelper.randomNumbers(0, undefined, 10000, false);
            numbers.map( it => this.expect( MarshalData.unmarshalNumber( BufferReader.create ( MarshalData.marshalNumber(it) ) ), it ));

        },

        'marshal big numbers INT': async function () {

            const numbers = TestsHelper.randomNumbers(Number.MAX_SAFE_INTEGER- 1000, Number.MAX_SAFE_INTEGER, 100000, false);
            let sum = new BN(0);
            numbers.map( it => sum = sum.add( new BN(it) ));

            this.expect( sum.gte(0), true );

            if (numbers.length > 0)
                this.expect( sum.gte(numbers[0]), true );

            this.expect( MarshalData.decompressBigNumber( MarshalData.compressBigNumber( sum )).eq( sum ), true  );

            let sum2 = new BN(0);
            numbers.map( it => sum2 = sum2.add( new BN(it) ));

            this.expect( MarshalData.decompressBigNumber( MarshalData.compressBigNumber( sum )).eq( sum2 ), true  );

        },

        'marshal big numbers ': async function () {

            for (let i=0; i < 10000; i++){

                const number = new BN(i);
                const buffer = MarshalData.compressBigNumber( number );

                this.expect( buffer.length > 0, true );

                this.expect( MarshalData.decompressBigNumber( buffer ).eq( new BN(i) ), true  );

            }

        },

        'marshal big random numbers ': async function () {

            for (let i=0; i < 10000; i++){

                const value =  Math.floor( Math.random()*Number.MAX_SAFE_INTEGER );
                const number = new BN(  value  );
                const buffer = MarshalData.compressBigNumber( number );

                this.expect( buffer.length > 0, true );

                this.expect( MarshalData.decompressBigNumber( buffer ).eq( new BN(value) ), true  );

            }

        }

    });

}