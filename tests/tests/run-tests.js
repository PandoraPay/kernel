import describe from './unit-testing/describe-list';

const  fs = require('fs'),
       path = require('path');

/**
 * scope:
 *          argv, logger,
 */


export default async function runTests( scope ){

    /**
     * The describe.js library doesn't really support promises. A simple library which supports Promises was written that behave in a similar way
     */

    scope.logger.info(`Status`, `Running tests`);

    //node.js describe  package
    if ( typeof describe === "object" && describe.config ) {
        describe.config( 'timeout', 120*1000);
        describe.config( 'callbackMode', "promises");
        describe.config( 'scope', scope);
    }

    //Find which tests should be run.
    let tests;
    if (scope.argv.tests.runOnlySpecificTests) {

        tests = scope.argv.tests.runOnlySpecificTestFilename||'';

        if (tests === '')
            tests = await scope.readline.input("Test name");

    }

    //include all other module tests

    for (const test of scope.tests)
        await test(scope);

    await describe.getResults( data => {

    });

   
}

function _getTestPaths(dir, fileList) {

    let files = fs.readdirSync(dir);
    fileList = fileList || [];

    files.forEach( (file) => {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            fileList = _getTestPaths(path.join(dir, file), fileList);
        } else {
            fileList.push(path.join(dir, file));
        }
    });

    return fileList.filter( file => path.extname(file) === '.js' );
}

