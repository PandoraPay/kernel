module.exports = {

    enabled: false,
    directory: 'tests/tests-files',

    runOnlySpecificTests: false,
    runOnlySpecificTestFilename: '',

    isEnabled(){
        return this.enabled;
    }

}