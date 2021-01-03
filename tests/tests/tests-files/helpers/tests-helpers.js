import TestsNumberHelper from "./tests-number-helper"
import TestsEnumHelper from "./tests-enum-helper"

export default async function run(){

    await TestsNumberHelper();
    await TestsEnumHelper();

}

