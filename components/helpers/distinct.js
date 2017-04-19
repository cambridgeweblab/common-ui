define('distinct', [], () =>
    /**
     * Returns a distinct array from an array based on a function projection.
     * @param {Array} array - the array to reduce
     * @param {Function} projection - function to determine how to filter
     * @returns {Array} distinct array
     */
    function distinct(array, projection) {
        return array.reduce((uniqueList, item, index) => {
            const alreadyIncluded = uniqueList.map(existingItem => projection(existingItem)).indexOf(projection(item));

            if (alreadyIncluded === -1) {
                uniqueList.push(item);
            }

            return uniqueList;
        }, []);
    }
);
