module.exports = class ReadlineBrowser {

    constructor(scope){

        this._scope = scope;

    }

    input (text = '', defaultValue = ''){
        return prompt(text);
    }

    confirm(text = ''){
        return confirm(text);
    }

}
