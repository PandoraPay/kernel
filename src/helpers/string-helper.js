import sanitizeHtml from "sanitize-html";

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

        str = StringHelper.removeWhitespaces(str);
        return str.split(/[, .;:'"!@#^*()?\-+{}]+/);

    }

    splitCommaSeparatedWords(str ){

        str = StringHelper.removeWhitespaces(str);
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


}


export default new StringHelper();