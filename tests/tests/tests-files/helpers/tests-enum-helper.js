import EnumHelper from "src/helpers/enum-helper"
import describe from 'tests/tests/unit-testing/describe';

export default async function run(){

    describe("Tests Enum Helper", {

        "Running Enum Helper tests": function () {

            const enumeration = {
                value1: 0,
                value2: 5,
                value3: 7,

                call: function (){
                  return 8;
                },

                _name: "EnumerationTest",
            };

            this.expect(enumeration.value1, 0);
            this.expect(enumeration.value2, 5);
            this.expect(enumeration.value3, 7);

            for (let value=0; value < 10; value++)
                this.expect(EnumHelper.validateEnum( value, enumeration), Object.keys(enumeration).reduce((res, key) => res || enumeration[key] === value, false ));

            this.expect(EnumHelper.validateEnum(enumeration.value1, enumeration), true);
            this.expect(EnumHelper.validateEnum(enumeration.value2, enumeration), true);
            this.expect(EnumHelper.validateEnum(enumeration.value3, enumeration), true);
            this.expect(EnumHelper.validateEnum(1, enumeration), false);
            this.expect(EnumHelper.validateEnum(2, enumeration), false);
            this.expect(EnumHelper.validateEnum(8, enumeration), false);

            this.expect( EnumHelper.validateEnum(enumeration._name, enumeration), false);
            this.expect(EnumHelper.validateEnum("test", enumeration), false);
            this.expect(EnumHelper.validateEnum("enumerationTest", enumeration), false);
            this.expect(EnumHelper.validateEnum("call", enumeration), false);
            this.expectError( () => EnumHelper.validateEnum( enumeration.call, enumeration) );

        },

    });

};