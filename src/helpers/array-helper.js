export default class ArrayHelper {

    static isByteArray(array, length = 0) {

        if (!Array.isArray(array)) return false;
        if (length > 0 && array.length !== length) return false;

        for (let it = 0; it < array.length; it++)
            if (array[it] < 0 || array[it] > 255) return false;

        return true;

    }

    static unionUnique(...args) {
        return [...new Set([].concat(...args))];
    }

}

