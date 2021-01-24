const TestsNumberHelper = require("./tests-number-helper")
const TestsEnumHelper = require("./tests-enum-helper")

module.exports = async function run(){

    await TestsNumberHelper();
    await TestsEnumHelper();

}

