/* global $ */
define([
    './helpers/create-element.js',
    './helpers/cancel-event.js',
    './helpers/clear-element.js',
    './helpers/component-support.js',
    './helpers/post-via-iframe.js',
    './helpers/trace.js',
    './helpers/validate-against-schema.js',
    './helpers/to-camel-case.js',
    'document-register-element'
], (createElement, cancelEvent, clearElement, componentSupport, postViaIframe, trace, validateAgainstSchema, toCamelCase) => {

    //
    // TODO: consider adding method to validate attachment data against headers before firing external events
    //
    /**
     * Class Import for a ca-import web component
     * @extends HTMLElement
     */
    class Import extends HTMLElement {
        /**
         * Executes when the element is first created
         * @returns {undefined} nothing
         */
        createdCallback() {
            const label = createElement(this, 'label', {});
            createElement(label, 'span', {});
            this.link = createElement(label, 'a', { class: 'ca-import-download', href: '#', target: '_target', download: 'template.csv' }, 'Download Template');
            this.form = createElement(label, 'form');
            createElement(this.form, 'div', {}, 'Upload');
            this.input = createElement(this.form, 'input', { name: 'ca-import-upload', type: 'file', accept: '.csv' });
            const table = createElement(this, 'table', {});
            createElement(table, 'colgroup', {});
            createElement(table, 'thead', {});
            createElement(table, 'tbody', {});

            this.input.onchange = this.fileHandler.bind(this);
            this.input.onclick = this.fileClick.bind(this);
            this.link.onclick = this.downloadTemplateHandler.bind(this);
        }

        /**
         * Executes when any attribute is changed on the element
         * @param  {string} attrName - the name of the attribute to have changed
         * @param  {string} oldVal - the old value of the attribute
         * @param  {string} newVal - the new value of the attribute
         * @returns {undefined} nothing.
         */
        attributeChangedCallback(attrName, oldVal, newVal) {
            switch (attrName) {

                case 'label':
                    this.querySelector('label span').textContent = this.label;
                    break;

                default: break;
            }

        }

        /**
         * Gets label attribute
         * @returns {string} label attribute
         */
        get label() {
            return this.getAttribute('label');

        }

        /**
         * Sets label attribute
         * @param {string} label to set
         */
        set label(label) {
            this.setAttribute('label', label);
        }

        /**
         * Gets saveUrl attribute
         * @returns {string} label attribute
         */
        get saveUrl() {
            return this.getAttribute('saveUrl');
        }

        /**
         * Sets saveUrl attribute
         * @param {string} saveUrl attribute
         */
        set saveUrl(saveUrl) {
            this.setAttribute('saveUrl', saveUrl);
        }

        /**
         * Gets rawFile value
         * @returns {string} rawfile
         */
        get rawFile() {
            return this._raw || '';
        }

        /**
         * Gets data value
         * @returns {array} data
         */
        get data() {
            return this._data;
        }

        /**
         * Sets data value
         * @param {array} value to set
         */
        set data(value) {
            this._data = value;

            if (this.data && this.data.length > 0) {
                this.hasData = true;
                this.render();
            } else {
                this.hasData = false;
            }
        }

        /**
         * Gets schema
         * @returns {object} schema
         */
        get schema() {
            return this._schema;
        }

        /**
         * Sets schema
         * @param {object} value, schema
         */
        set schema(value) {
            this._schema = value;
        }

        /**
         * Gets header value
         * @returns {string} header
         */
        get headers() {
            return (this.getAttribute('headers') || '').split(',');
        }

        /**
         * Sets headers
         * @param {array} headers to set
         */
        set headers(headers) {
            const parsedHeaders = Array.isArray(headers) ? headers.join(',') : headers;

            if (parsedHeaders === '') {
                this.removeAttribute('headers');
            } else {
                this.setAttribute('headers', parsedHeaders);
            }
        }

        /**
         * Gets first row
         * @returns {string} firstrow seperated by pipe
         */
        get firstRow() {
            return (this.getAttribute('first-row') || '').split('|');
        }

        /**
         * sets rawFile value
         * @param {array} values for firstrow
         */
        set firstRow(values) {

            const firstRowAttributes = Array.isArray(values) ? values.join('|') : values;

            if (firstRowAttributes === '') {
                this.removeAttribute('first-row');
            } else {
                this.setAttribute('first-row', firstRowAttributes);
            }
        }


        /**
         * Gets hasData attribute
         * @returns {string} hasData attribute
         */
        get hasData() {
            return this.getAttribute('has-data');
        }

        /**
         * Sets hasData attribute
         * @param {boolean} value, boolean
         */
        set hasData(value) {
            this.setAttribute('has-data', value === true);
        }

        /**
         * Gets hasErrors attribute
         * @param {string} hasErrors attribute
         */
        get hasErrors() {
            return this.getAttribute('has-errors');
        }

        /**
         * Sets hasErrors attribute
         * @param {boolean} value, boolean
         */
        set hasErrors(value) {
            this.setAttribute('has-errors', value === true);
        }

        /**
         * Gets import type
         * @param {string} type of import
         */
        get type() {
            return this.getAttribute('type') || 'csv';
        }

        /**
         * Sets type attribute
         * @param {string} value - type of import
         */
        set type(value) {
            // ensure its always csv or xlsx
            // eslint-disable-next-line no-param-reassign
            const type = (value !== 'xlsx') ? value = 'csv' : 'xlsx';

            this.setAttribute('type', type);
            this.input.setAttribute('accept', `.${type}`);
            this.link.setAttribute('download', `template.${type}`);
        }

        /**
         * Gets convert url
         * @param {string} convert url
         */
        get convertUrl() {
            return this.getAttribute('convert-url') || '/ca-import';
        }

        /**
         * Sets convertUrl
         * @param {string} value, defaults to ca-import
         */
        set convertUrl(value = '/ca-import') {
            this.setAttribute('convert-url', value);
            this.form.action = value;
        }

        /**
         * Gets end point that creates excel file from headers - only required for type=xls
         * @returns {string} url
         */
        get templateConversionUrl() {
            return this.getAttribute('template-conversion-url') || '/excel-download';
        }

        /**
         * Sets end point that creates excel file from headers - only required for type=xls
         * @param {string} value, url value
         */
        set templateConversionUrl(value = '/excel-download') {
            this.setAttribute('template-conversion-url', value);
            this.form.action = value;
        }


        /**
         * Called when saving, makes an Ajax post.
         * @returns {undefined} nothing.
         */
        save() {
            if (this.saveUrl) {
                componentSupport
                    .request({
                        url: this.saveUrl,
                        type: 'POST',
                        dataType: 'json',
                        data: this.data,
                        contentType: 'application/json'
                    })
                    .then(data => {
                        trace('CSV file converted and posted');
                        this.onsave.call(data);
                    });
            }
        }

       /**
        * Executes once data has been posted to the server
        * @param {array} data, table data
        * @returns {undefined} nothing.
        */
        onsave(data) {
            trace('saved');
        }

       /**
        * Executes when the user adds a file
        * @returns {undefined} nothing.
        */
        onfileadded() {
            trace('user added file containing data');
        }

       /**
        * Renders the HTML view of the data if present
        * @param {array} headers to use for table
        * @param {array} data to use for rows
        * @returns {undefined} nothing. Builds table to DOM
        */
        render(headers = this.headers, data = this._data) {
            if (data) {
                const table = this.querySelector('table');
                const colGroup = table.querySelector('colgroup');
                const thead = table.querySelector('thead');
                const tbody = table.querySelector('tbody');

                // remove previous values
                clearElement(colGroup);
                clearElement(thead);
                clearElement(tbody);

                // remove any errors on this form
                this.form.removeAttribute('data-error');
                const formError = document.querySelector('ca-form [data-error]');
                if (formError) {
                    formError.removeAttribute('data-error');
                }

                if (headers.length > 0) {

                    const tr = createElement(null, 'tr');

                    // insert table headers
                    for (let i = 0, l = headers.length; i < l; i++) {

                        const label = headers[i].replace('*', '');
                        const key = toCamelCase(label.trim());

                        // insert selection col/header cell
                        createElement(colGroup, 'col', { 'data-key': key });

                        // insert header cell into header row
                        const th = createElement(tr, 'th', { 'data-key': key });

                        // insert value within a span to allow us to alter its value via CSS (hide span, insert content before etc)
                        createElement(th, 'span', null, label);
                    }

                    thead.appendChild(tr);
                }

                data.forEach((item, index) => {

                    const tr = createElement(null, 'tr');

                    for (let i = 0, l = headers.length; i < l; i++) {

                        const key = headers[i].replace('*', '');
                        const value = item[key] || item[i] || '';

                        createElement(tr, 'td', { title: value }, value);
                    }

                    tbody.appendChild(tr);
                });
            }
        }

        /**
         * if we have first row values, bind with add them as an example row (to be removed during import)
         * @returns {array} example row.
         */
        buildExampleRow() {

            if (this.firstRow.length > 0) {

                const exampleRow = {};
                const len = Math.min(this.headers.length, this.firstRow.length);

                for (let i = 0; i < len; i++) {
                    exampleRow[this.headers[i]] = this.firstRow[i] || '';
                }

                return exampleRow;
            }

            return null;
        }

        downloadTemplateHandler(e = event) {
            const el = e.target || e.srcElement;

            switch (this.type) {

                case 'csv':
                    el.href = `data:text/plain;charset=utf-8,${encodeURIComponent(this.headers)}`;
                    break;

                case 'xlsx': {

                    cancelEvent(e);

                    const rows = [];      // collection of rows
                    const rowData = {};   // individual row item (js object key/values)

                     // convert header array into a JSON key/value object
                    for (let i = 0, l = self.headers.length; i < l; i++) {
                        rowData[self.headers[i]] = '';
                    }

                     // get the example row if this.firstRow attribute is set
                    const exampleRow = this.buildExampleRow();
                    if (exampleRow) {
                        rows.push(exampleRow);
                    }

                     // as its a template create some blank rows to ensure formatting is respected
                    let numOfBlankRows = 25;
                    while (numOfBlankRows--) {
                        rows.push(rowData);
                    }

                     // post to server via iframe, server will convert to excel and trigger a download
                    postViaIframe(this.templateConversionUrl, {
                        json: JSON.stringify(rows)
                    });

                } break;

                default: break;
            }
        }

         /**
          * clear the file upload path to allow the same file to trigger the onchange event
          * @param {event} e, event triggered
          * @returns {undefined} nothing.
          */
        fileClick(e) {
            this.input.value = '';
        }

         /**
          * File event handler
          * @param {event} e, event triggered
          * @returns {undefined} example row.
          */
        fileHandler(e = event) {
            const el = e.target || e.srcElement;

            if (el && el.files) {

                const file = el.files[0];

                switch (this.type) {
                    case 'csv': this.readFileAsCsv(file); break;
                    case 'xlsx': this.convertXlsxToJson(); break;
                    default: break;
                }
            }
        }

         /**
          * check each row against the schema, if its invalid add it to the list or errors returned
          * @param {object} dataObjects - array of excel data in object (key/value) format
          * @returns {array} list of errors.
          */
        validateRows(dataObjects) {
            const errors = [];

            if (this.schema && this.schema.properties) {

                dataObjects.forEach(function(row, index) {
                    Object.keys(row).forEach(key => {
                        const error = validateAgainstSchema(this.schema, key, row[key]);

                        if (error) {
                            errors.push([index + 1, key, row[key], error]);
                        }
                    });
                });
            }

            return errors;
        }

         /**
          * To convert the .xls file we upload it to the server and get an JSON array for each worksheet back
          * @param {object} file - array of excel data in object (key/value) format
          * @returns {undefined} nothing.
          */
        convertXlsxToJson(file) {
            const formData = new FormData();

             // use the browser form object to handle the upload (removes the need to parse the file)
            formData.append('ca-import-upload', this.input.files[0]);

             // preform the conversion
            componentSupport.request({
                url: this.convertUrl,
                type: 'POST',
                dataType: 'json',
                data: formData
            })
             .then(data => {

                 if (data && data.length > 0 && data[0].length > 0) {

                     // keep a raw copy for debugging
                     this._raw = data;

                     // remove the example row if it exists anywhere in the table of data
                     const dataWithoutExampleRow = (data[0] || []).filter(row => {

                         // only do this check if ca-import has .firstRow values
                         if (this.firstRow && this.firstRow.length > 0) {

                             // assume this row is an example row
                             let isExampleRow = true;

                             // go through each cell value, if we dont get a match flip isExampleRow
                             for (let i = 0, l = this.firstRow.length; i < l; i++) {
                                 if (row[i] !== this.firstRow[i]) {
                                     isExampleRow = false;
                                     break;
                                 }
                             }

                             // only return true if this is not an example row (removes it from the array)
                             return (!isExampleRow);
                         }

                         // we dont have a firstRow so just include all rows
                         return true;
                     });

                     // convert table data into array of objects, key/value object for each row
                     const jsonData = this.convertExcelJsonToJsonKeyedObjects(dataWithoutExampleRow);

                     // validate if we have a schema
                     const errors = this.validateRows(jsonData);

                     if (errors.length <= 0) {

                         // convert worksheet row/col data into array of json objects (ignore everything other than the first worksheet - for now!)
                         this._data = jsonData;

                         // fire an event to let the consumer know a file with data was added
                         // if the handler returns false, the file will not be rendered
                         if (this.onfileadded(this._data) !== false) {

                             // insert a HTML table containing the data
                             this.render();

                             // allow CSS to update the UI (removed input and displays table)
                             this.hasData = true;
                             this.hasErrors = false;
                         }
                     } else {

                         // insert a HTML table containing errors
                         this.render(['Row', 'Column', 'Value', 'Error'], errors);

                         // allow CSS to update the UI (shows the table of errors)
                         this.hasErrors = true;

                         // clear the file upload path to allow the same file to trigger the onchange event
                         this.input.value = '';

                         console.log(errors);
                     }
                 }

             });
        }

         /**
          * Reads file as CSV and loads the file
          * @param {file} file to read
          * @returns {undefined} nothing, reads file as text
          */
        readFileAsCsv(file) {

            const self = this;

            if (file) {

                const reader = new FileReader();

                 // once loaded, update the UI
                reader.onload = function() {

                     // if we have some file data, process it
                    if (this.result !== '') {

                         // keep a raw copy
                        self._raw = this.result;

                         // convert CSV into array of JSON object and expose them via this.data property
                        self._data = self.convertCsvToJson.call(self, this.result);

                         // fire an event to let the consumer know a file with data was added
                         // if the handler returns false, the file will not be rendered
                        if (self.onfileadded.call(self, self._data) !== false) {

                             // insert a HTML table containing the data
                            self.render.call(self);

                             // allow CSS to update the UI (removed input and displays table)
                            self.hasData = true;

                        }
                    }
                };

                 // load the file data
                reader.readAsText(file);
            }
        }

         /**
          * Takes a JSON Array of worksheet data (returned from server Excel > JSON)
          * Creates a JSON object for each row of data using column headers as keys
          * @param {array} data - single worksheet json array containing rows/columns (first row must have headers)
          * @returns {array} json object array.
          */
        convertExcelJsonToJsonKeyedObjects(data) {

            if (!data) return;

            const result = [];
            const headers = data[0];
            const rowLen = data.length;
            const colLen = headers.length;
            const schema = (this.schema || {}).properties;
            let key = '';

             // go through all rows (skipping the header)
            for (let i = 1; i < rowLen; i++) {

                const row = data[i];
                const item = {};      // clear previous item

                 // create line item (a cell at a time)
                for (let ii = 0; ii < colLen; ii++) {

                     // use header item as the key (remove any asterisks which indicate its a mandatory field)
                    key = headers[ii].replace('*', '');

                     // set the property value
                    item[key] = row[ii] || '';

                     // if the item is not required and is empty, remove it (dont send empty strings to the server as spring attempts to run them through the regex)
                    if (schema && schema[key] && !schema[key].required && item[key] === '') {
                        delete item[key];
                    }
                }

                result.push(item);
            }
             // eslint-disable-next-line consistent-return
            return result;
        }

         /**
          * Takes a JSON Array of worksheet data (returned from server CSV > JSON)
          * Creates a JSON object for each row of data using column headers as keys
          * @param {array} text - single worksheet json array containing rows/columns (first row must have headers)
          * @returns {array} json object array.
          */
        convertCsvToJson(text) {
            const lines = text.split(/\r\n?|\n/);
            const headers = lines[0].split(',');
            const result = [];

            for (let i = 1, l = lines.length; i < l; i++) {

                const data = lines[i].split(',');

                if (data.length === headers.length) {

                    const item = {};

                    for (let ii = 0, ll = headers.length; ii < ll; ii++) {
                        const key = toCamelCase(headers[ii].trim());
                        item[key] = data[ii].trim();
                    }

                    result.push(item);
                }
            }

            this.headers = headers;

            return result;
        }
    }

    document.registerElement('ca-import', Import);

});
