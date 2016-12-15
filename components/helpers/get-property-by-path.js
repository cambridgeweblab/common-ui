define('get-property-by-path', [], () => {
    /**
    * Gets a property of an object from a path string (auto resolves json schema paths)
    * @param {object} obj - object to inspect
    * @param {string} prop - property path e.g. 'basics.name'
    * @param {boolean} isSchema - true or false
    * @returns {object} schema property
    */
    const getPropertyByPath = function (obj, prop, isSchema) {

        if (typeof obj === 'undefined') {
            return false;
        }

        // is this a schema object?
        // eslint-disable-next-line
        isSchema = obj.$schema !== undefined || isSchema;

        // all json schema properties are prefixed with either properties or items
        if (isSchema) {

            if (obj.properties && prop.indexOf('.properties') <= -1) {
                // if the object has a properties property, search that
                // eslint-disable-next-line
                prop = `properties.${prop}`;
            } else if (obj.items && prop.indexOf('.items') <= -1) {
                // otherwise check if it has an items property
                // eslint-disable-next-line
                prop = `items.${prop}`;
            }

        }

        // check if we have any children properties
        const index = prop.indexOf('.');

        if (index > -1) {

            // eslint-disable-next-line
            obj = obj[prop.substring(0, index)];
            // eslint-disable-next-line
            prop = prop.substr(index + 1);

            return getPropertyByPath(obj, prop, isSchema);
        }

        return obj[prop];
    };

    return getPropertyByPath;
});
