export default {

    enabled: false,
    directory: 'tests/tests-files',

    runOnlySpecificTests: false,
    runOnlySpecificTestFilename: '',

    isEnabled(){
        return process.env.tests && this.enabled;
    }

}