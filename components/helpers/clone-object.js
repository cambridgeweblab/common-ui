define('clone-object', [], () =>
    /**
     * Returns a clone of a plain JSON object (no functions).
     * @param {object} obj - the object data to clone
     * @return {object} a clone of the object's property values
     */
    function cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
);
