const Exception = require.main.require('./src/helpers/exception');
const BN = require("bn.js");

class DescribeList {

    constructor(){

        this._config = {
            timeout: 10000,
        };

        this._list = [];
        this._testResults = [];

    }


    describe(name, tests, options){

        if (options === undefined)
            options = {};

        this._list.push({
            name: name,
            tests: tests,
            options: options
        })

    }

    config(name, value){
        this._config[name] = value;
    }

    expectError(a){
        
        try {

            if (typeof a === "object" && typeof a.then === 'function' )
                return new Promise( async (resolve)=>{
                    try{
                        await a;
                    }catch (err){
                        return resolve(true);
                    }
                    resolve(false);
                });
            else
                a();

        } catch (err){
            return true;
        }

        throw new Exception(this, `It should have raise an error`);
    }
    
    expect(a, b){

        /**
         * Arguments a and b can be promises, so they should be solved.
         */
        if (typeof a === "object" && typeof a.then === 'function' || typeof b === "object" && typeof b.then === 'function')
            return new Promise( async (resolve)=>{

                if (typeof a === "object" && typeof a.then === 'function') a = await a;
                if (typeof b === "object" && typeof b.then === 'function') b = await b;

                resolve ( this.expect(a, b) );

            });


        if (Buffer.isBuffer(a) || Buffer.isBuffer(b)){

            if (a.equals(b)) this._testResults.push( a.toString("hex") );
            else throw new Exception(this, "Expected "+b.toString("hex")+" but got "+a.toString("hex"));

        } else
        if (Array.isArray(a) || Array.isArray(b)){

            if (a.length !== b.length) throw new Exception(this, "Lengths mismatch "+JSON.stringify(b)+" but got "+JSON.stringify(a)); else
            if (JSON.stringify(a) !== JSON.stringify(b)) throw new Exception(this, "Expected"+JSON.stringify(b)+" but got "+JSON.stringify(a));

        }else
        if (a instanceof BN || b instanceof BN){

            if (a.eq(b)) this._testResults.push( a.toString() );
            else throw new Exception(this, "Expected "+b.toString()+" but got "+a.toString());

        }else {
            if (a === b) this._testResults.push(a);
            else throw new Exception(this, `Expected ${b}, but got ${a}`);
        }

        return true;
    }

    async _execute(){

        const result = {
            total: 0,
            passed: 0,
            results: {

            },
        };

        const processEnvSlave = {};
        
        for (const describeIt in this._list) {

            const describe = this._list[describeIt];
            const describeName = typeof describe.name === "function" ? describe.name.call(this) : describe.name;

            if (process.env.SLAVE) {
                let found = false;
                for (let i = 0; ; i++)
                    if (process.env["testDescribe" + i] === describeName) found = true;
                    else if (!process.env["testDescribe" + i]) break;

                if (!found) continue;
            }

            let testErrors = 0,  testPassed=0;
            const testOutputs = {
                results:{},
                errors: {},
                elapsedTimes: {},
            };

            this._scope.logger.log("tests", `${ describeName }`);
            
            for (const testIt in describe.tests){

                const test = describe.tests[testIt];
                const testName = typeof test.name === "function" ? test.name.call(this) : test.name;

                if (process.env.SLAVE) {
                    let found = false;
                    for (let i = 0; ; i++)
                        if (process.env["testName" + i] === testName) {
                            processEnvSlave["testName"+i] = true;
                            found = true;
                        }
                        else if (!process.env["testName" + i]) break;

                    if (!found) continue;
                }

                const testOutput = await this._processTest(describe, test , describeName, testName);

                if (testOutput.error)
                    testErrors++;
                else
                    testPassed++;

                if (testOutput.results.length > 0)
                    testOutputs.results[testIt] = testOutput.results;

                if (testOutput.error !== undefined)
                    testOutputs.errors[testIt] = testOutput.error;

                testOutputs.elapsedTimes[testIt] = testOutput.elapsedTime;

                if (testOutput.error) {
                    this._scope.logger.error("tests", `    ${testName}  ${testOutput.elapsedTime} ms`);
                    this._scope.logger.error("tests", testOutput.error);
                } else {
                    this._scope.logger.info("tests", `    ${testName}  ${testOutput.elapsedTime} ms`);
                }

            }

            result.results[describe.name] = {
                total: testPassed + testErrors,
                passed: testPassed,
                results: testOutputs.results,
                errors: testOutputs.errors,
                elapsedTimes: testOutputs.elapsedTimes,
            };

            result.total += testPassed + testErrors;
            result.passed += testPassed;

        }

        this._scope.logger.info("tests", `Passed ${result.passed}`);

        if (result.total - result.passed > 0)
            this._scope.logger.error("tests", `ERRORS ${result.total - result.passed}`);

        if (process.env.SLAVE)
            for (let i = 0; ; i++)
                if (process.env["testName" + i] && !processEnvSlave["testName"+i])
                    this._scope.logger.error("tests", `Process Env Slave couldn't find: ${process.env["testName" + i]}`);
                else if (!process.env["testName" + i]) break;

        return result;

    }

    _processTest(describe, test, describeName, testName ){

        this._config.scope.argv.masterCluster.workerEnv = {
            ...this._config.scope.argv.masterCluster.workerEnv,
            testDescribe0: describeName,
            testName0: testName,
        };

        this._config.scope.argv.masterCluster.autoRespawn = false;

        return new Promise( async (resolve)=>{

            let error;

            this._testResults = [];

            let timestamp1 = new Date().getTime( );
            let timestamp2 = new Date().getTime( );

            let timeout = setTimeout(()=>{

                resolve({
                    error: `Timeout ${describe.options.timeout||this._config.timeout}`,
                    results: this._testResults,
                    elapsedTime: timestamp2 - timestamp1,
                });

            }, describe.options.timeout||this._config.timeout);

            try{

                await test.call(this);

            } catch (ex){

                error = ex;

            }

            clearTimeout(timeout);

            timestamp2 = new Date().getTime();

            resolve({
                error: error,
                results: this._testResults,
                elapsedTime: timestamp2 - timestamp1,
            });


        });



    }

    get _scope(){
        return this._config.scope;
    }

    async getResults(callback){

        let output = await this._execute();
        callback(output);

    }



}

module.exports = new DescribeList();