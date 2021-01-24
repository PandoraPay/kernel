module.exports = class ArrayHelper {

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

    /**
     * Insert an element into a sorted array
     * O(log N)
     * @param el
     * @param arr
     * @param compare
     * @returns {*}
     */
    static addSortedArray(el, arr,  compare  = (a,b) => a - b) {

        arr.splice( ArrayHelper.binarySearch(el, arr, 0, arr.length, compare ) + 1, 0, el);

        return arr;
    }

    /**
     * Remove an element from a sorted array
     * O(log N)
     * @param el
     * @param arr
     * @param compare
     * @returns {*}
     */
    static removeSortedArray(el, arr, compare  = (a,b) => a - b) {

        const found = ArrayHelper.binarySearch(el, arr, 0, arr.length, compare);

        if (typeof el === "object"){

            let i = found;
            while (i < arr.length && compare(arr[i], el) === 0){
                if (arr[i] === el){
                    arr.splice( i, 1);
                    return arr;
                }
                i++;
            }

            i = found;
            while ( i >= 0 && compare(arr[i], el) === 0){
                if (arr[i] === el){
                    arr.splice(i, 1);
                    return arr;
                }
                i--;
            }

        } else { //not an object, number, string
            if (arr[found] === el)
                arr.splice( found, 1);
        }

        return arr;
    }

    static binarySearch(el, arr, st, en, compare) {

        const pivot = (st + en) >> 1;  // should be faster than dividing by 2

        const c = pivot < arr.length ? compare(el, arr[pivot]) : 0;

        if (en - st <= 1 ) return c < 0 ? pivot - 1 : pivot;

        if (c < 0) return ArrayHelper.binarySearch(el, arr, st, pivot, compare);
        if (c == 0) return pivot;
        if (c > 0) return ArrayHelper.binarySearch(el, arr, pivot, en, compare);

    }

}

