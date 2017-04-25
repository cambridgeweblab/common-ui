define('to-camel-case', [], () =>
    /**
     * @description Converts a string to camel case string
     * @param {string} str - the string to convert
     * @returns {string} the camel case string
     */
    function toCamelCase(str) {
        return str.replace(/^([A-Z])|\s(\w)/g, (match, p1, p2, offset) => {
            if (p2) return p2.toUpperCase();
            return p1.toLowerCase();
        });
    }
);
