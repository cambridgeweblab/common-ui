define('escape-html', ['./create-element.js'], (createElement) =>
    /**
     * Escapes text which may contain characters such as <, &, etc. so it can be safely treated as HTML.
     * @param {string} unsafeContent - text content without HTML escaping
     * @returns {string} the same text, but with HTML entities included as necessary
     */
    function escapeHtml(unsafeContent) {
        return createElement(null, 'span', {}, unsafeContent).innerHTML;
    }
);
