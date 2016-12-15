define('get-sorted-schema-keys', [], () =>
    /**
     * @description Returns JSON Schema property keys in order based on value of .id property value
     * @returns {Object} keys - schema keys in order based on id
     */
    function getSortedSchemaKeys (schema) {
        // eslint-disable-next-line no-param-reassign
        schema = schema.properties || schema;

        // get the keys
        const keys = Object.keys(schema);

        keys.sort((a, b) => {

            const aId = (schema[a].id) ? parseInt(schema[a].id.replace(/[^0-9]+/gi, '') || '0', 0) : 0;
            const bId = (schema[b].id) ? parseInt(schema[b].id.replace(/[^0-9]+/gi, '') || '0', 0) : 0;

            return (aId - bId);
        });

        return keys;
    }
);
