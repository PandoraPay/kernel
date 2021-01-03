import NumberHelper from "src/helpers/number-helper"
import BufferReader from "src/helpers/buffers/buffer-reader"

import describe from 'tests/tests/unit-testing/describe';

export default async function run(){

    describe("Tests Number Helper", {

        "Running Marshal Number tests": function (){

            this.expect( NumberHelper.marshalNumber(5), Buffer.from("05", "hex") );
            this.expect( NumberHelper.marshalNumber(123), Buffer.from("7b", "hex") );
            this.expect( NumberHelper.marshalNumber(128), Buffer.from("8001", "hex") );
            this.expect( NumberHelper.marshalNumber(256), Buffer.from("8002", "hex") );
            this.expect( NumberHelper.marshalNumber(271), Buffer.from("8F02", "hex") );
            this.expect( NumberHelper.marshalNumber(66543), Buffer.from("EF8704", "hex") );
            this.expect( NumberHelper.marshalNumber(66580), Buffer.from("948804", "hex") );
            this.expect( NumberHelper.marshalNumber(10000000000), Buffer.from("80C8AFA025", "hex") );
            this.expect( NumberHelper.marshalNumber(31231235643), Buffer.from("BBAC9BAC74", "hex") );
            this.expect( NumberHelper.marshalNumber(Number.MAX_SAFE_INTEGER), Buffer.from("FFFFFFFFFFFFFF0F", "hex") );


        },

        "Running Unmarshal Tests": function (){

            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(5) )), 5 );
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(123))), 123 );
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(128))), 128 );
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(256))), 256 );
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(271))), 271 );
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(66543))), 66543 );
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(66580))), 66580);
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(10000000000))), 10000000000);
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(31231235643))), 31231235643);
            this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(Number.MAX_SAFE_INTEGER))), Number.MAX_SAFE_INTEGER);

        },

        "Running Marshal/Unmarshal Random Tests": function (){

            for (let i=0; i< 200000; i++){
                let rand = Math.floor( Math.random()*Number.MAX_SAFE_INTEGER);
                this.expect( NumberHelper.unmarshalNumber( BufferReader.create( NumberHelper.marshalNumber(rand)), 7), rand);
            }

        }

    });

}

