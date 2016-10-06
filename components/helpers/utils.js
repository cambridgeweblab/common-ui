define('utils', [], () => {
    /**
    * toBoolean - casts a string value to boolean.
    * @param {string} value - value to cast to boolean.
    * @return {boolean} true/false - eval of value.
    */
    function toBoolean(value = false) {
        return value === 'true';
    }

    return {
        toBoolean
    };
});
