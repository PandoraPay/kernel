const sanitizeHtml = require("sanitize-html");

class StringHelper {

    /**
     * Triming string
     * @param str
     * @returns {string | *}
     */
    removeWhitespaces(str){
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/gm,'');
    }

    getNextLine(string){

        let i;
        for (i=0; i < string.length; i++){

            if (string[i] === '\n')
                break;

        }

        return {
            line: string.substr(0, i),
            string: string.substr(i+1)
        }
    }

    splitWords(str ){

        str = this.removeWhitespaces(str);
        return str.split(/[, .;:'"!@#^*()?\-+{}]+/);

    }

    splitCommaSeparatedWords(str ){

        str = this.removeWhitespaces(str);
        return str.split(/[,.;:]+/);

    }

    isHex( str ){

        return /[0-9A-Fa-f]+$/.test(str)

    }


    formatMiliseconds(millisec){

        const seconds = (millisec / 1000).toFixed(1);
        const minutes = (millisec / (1000 * 60)).toFixed(1);
        const hours = (millisec / (1000 * 60 * 60)).toFixed(1);
        const days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

        if (seconds < 60) return seconds + " Sec";
        else if (minutes < 60) return minutes + " Min";
        else if (hours < 24) return hours + " Hrs";
        else return days + " Days"

    }

    /**
     * Using array.join to make it faster
     * @param len
     * @returns {string}
     */
    generateRandomHex(len){

        const text = [];
        const possible = "ABCDEF0123456789";

        for (let i = 0; i < len; i++)
            text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

        return text.join('');
    }

    /**
     * Using array.join to make it faster
     * @param len
     * @returns {string}
     */
    generateRandomId(len){

        const text = [];
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < len; i++)
            text.push(possible.charAt(Math.floor(Math.random() * possible.length)));

        return text.join('');
    }

    isStringNumber(str) {
        return /^\d+(\.\d+)?/.exec(str);
    }

    sanitizeText(string){
        return sanitizeHtml( this.removeWhitespaces(string ) );
    }

    timeSince(date, longVersion = true ) {

        var seconds = Math.floor((new Date().getTime() - date) / 1000);

        var interval = Math.floor(seconds / 31536000);

        if (interval > 1)
            return interval + (longVersion ? " years" : ' y');

        interval = Math.floor(seconds / 2592000);
        if (interval > 1)
            return interval + (longVersion? " months" : ' mo');
        interval = Math.floor(seconds / 86400);
        if (interval > 1)
            return interval + (longVersion ? " days" : ' d');
        interval = Math.floor(seconds / 3600);
        if (interval > 1)
            return interval + (longVersion ? " hours" : ' h');

        interval = Math.floor(seconds / 60);
        if (interval > 1)
            return interval + (longVersion ? " minutes" : ' m');

        return Math.floor(seconds) + (longVersion? " seconds": ' s');
    }

    formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
        try {
            decimalCount = Math.abs(decimalCount);
            decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

            const negativeSign = amount < 0 ? "-" : "";

            let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
            let j = (i.length > 3) ? i.length % 3 : 0;

            return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
        } catch (e) {
            console.log(e)
        }
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }



}


module.exports = new StringHelper();