define('resolve-enum-titles', [], () =>
    /**
     * Converts an array of enum values into an array of enum titles for display.
     * @param {Array<Object>} schema - array of schema each of which has a title and enum array with single value
     * @param {Array} values - array of data values, each of which is to be returned as the corresponding title.
     * @returns {Array<string>} array of enum titles corresponding to values.
     */
    function resolveEnumTitles(schema, values) {
        const titles = {};

        if (Array.isArray(schema)) {
            // convert enum to object key value pair so the values can be found without iterating
            schema.forEach(item => {
                // add item to enum with key
                if (Array.isArray(item.enum) && item.title) {
                    titles[item.enum[0]] = item.title;
                }
            });
        }
        return values.map(id => titles[id] || id)
            // remove empty values
            .filter((item) => (item !== undefined && item !== ''))
            // alpha sort
            .sort((a, b) => a > b);
    }
);