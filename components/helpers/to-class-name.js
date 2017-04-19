define('to-class-name', [], () =>
    /**
     * Trim + replace space with hyphen + lower case.
     * @param {string} str - the string to convert to a class name
     * @return {string} a CSS class name
     */
    function toClassName(str) {
        return str.replace(/^\s+|\s+$/g, '').replace(/ /g, '-').toLowerCase();
    }
);
