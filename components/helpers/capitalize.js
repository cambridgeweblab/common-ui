define('capitalize', [], () =>
    /**
     * Initial-caps the string
     * @param {string} str - the string to modify
     * @returns {string} the same string with the first letter converted to upper case
     */
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
);
