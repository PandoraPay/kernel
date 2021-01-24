module.exports = class ExtendableError extends Error {

    constructor(name='', message='', data, level=0) {

        super( typeof name === "object" ? name.constructor.name : name);
        this.name = this.constructor.name;

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }

        this.message = message;
        this.data = data;

    }

    toString(){
        return `${this.name}:${typeof this.message === "object" ? JSON.stringify(this.message) : this.message }::${typeof this.data === "object" ? JSON.stringify( this.data ) : this.data }`;
    }

}



