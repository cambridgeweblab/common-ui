define('json-to-csv', [], () =>
    /**
    * Converts a JSON schema+data into valid CSV string
    * @param {object} schema - json schema used to render column headers
    * @param {obejct} data - data array contining items to render as rows
    */
    function jsonToCSV(schema, data = [], separator = ' ,', lineTerminator = '\n') {
        // eslint-disable-next-line no-param-reassign
        schema = ((schema && schema.properties) ? schema.properties : schema || {});

        // TECH-DEBT - sort out this throwing..
        // eslint-disable-next-line no-throw-literal
        if (separator.indexOf('"') > -1) throw 'Invalid separator';
        // eslint-disable-next-line no-throw-literal
        if (lineTerminator.indexOf('"') > -1) throw 'Invalid lineTerminator';

        const keys = [];
        let line = [];
        const rows = [];
        const headers = [];

        // wraps any value containing separators in quotes
        // need to also escape double quotes
        const escapeValue = function (value) {
            if (value.indexOf(separator) > -1 || value.indexOf(lineTerminator) > -1) {
                return `"${value.replace(/"/g, '"')}"`;
            }
            return value;
        };

        // get keys we're interested in
        Object.keys(schema).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(schema, key) && key !== 'links') {
                keys.push(key);
            }
        });

        // build headers
        keys.forEach(key => {
            headers.push(schema[key].title || key);
        });

        // add headers as first rows item
        rows.push(headers.join(separator));

        // build rows
        data.forEach(item => {

            line = []; // create new line collection

            // add each data item to the current line
            keys.forEach(key => {
                line.push(escapeValue(item[key] || ''));
            });

            // convert line into CSV row and add to rows collection
            rows.push(line.join(separator));
        });

        // split rows onto lines and return
        return rows.join(lineTerminator);
    }
);
