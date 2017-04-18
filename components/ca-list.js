define([
    './helpers/component-support.js',
    './helpers/get-sorted-schema-keys.js',
    './helpers/create-element-legacy.js',
    './helpers/trace.js',
    './helpers/clear-element.js',
    './helpers/parent-by-attribute.js',
    './helpers/parse-iso-local-date.js',
    './helpers/secureajax.js',
    'document-register-element'
], (componentSupport, getSortedSchemaKeys, createElement, trace, clearElement, getParentByAttribute, parseIsoLocalDate, ajax) => {
    /**
     * @exports ca-list
     * A custom HTML element (Web Component) that can be created using document.createElement('ca-list') or included in a HTML page as an element.
     * Setting the .src attribute forces the component to load the external (JSON v3 Schema/JSON data object) url,
     * follow the HATEOAS links to locate either the schema or data & render a HTML table matching the schema/data.
     */
    class List extends HTMLElement {
        /**
         * Executes when the element is first created
         * @returns {undefined} nothing
         */
        createdCallback() {

            // always render the search filter, but hide it via css unless data-searchable=true
            this.filterEl = createElement(this, 'input', {
                class: 'ca-list-filter',
                type: 'text',
                placeholder: 'Enter search terms to filter the list below'
            });
            this.filterEl.onkeyup = this.eventDelegate.bind(this);

            // build the HTML table and keep a reference to the elements we need to update later
            this.table = createElement(this, 'table', {});
            this.colgroup = createElement(this.table, 'colgroup', {});
            this.thead = createElement(this.table, 'thead', {});
            this.tbody = createElement(this.table, 'tbody', {});

            // capture click events and map them to internal UI event handler (sits at parent level and catches child clicks)
            this.table.onclick = this.eventDelegate.bind(this);

            // react to literal attributes
            if (this.src !== '') this.loadSrc();
            if (this.schema) this.createTable();
            if (this.sortIndex > -1) this.sortTable();
        }

        // noinspection JSUnusedGlobalSymbols
        /**
         * Executes when the element is attached to the DOM
         * @returns {undefined} nothing
         */
        attachedCallback() {
            this.attached = true;
        }

        /**
         * Executes when any attribute is changed on the element
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {undefined} nothing.
         */
        attributeChangedCallback(attrName, oldVal, newVal) {

            // Only need to re-render the component if the attrbute value has changed
            if (oldVal !== newVal) {

                switch (attrName) {

                    case 'src':
                        this.loadSrc();
                        break;

                    case 'sort-index':
                        this.sortTable();
                        break;

                    default:
                        break;
                }
            }
        }

        /** @return {string} url to schema or instance data containing HATEOAS links */
        get src() {
            return this.getAttribute('src') || '';
        }

        /** @param {string} value - url to schema or instance data containing HATEOAS links */
        set src(value) {
            this.setAttribute('src', value || '');
        }

        /** @return {array} contains array of table data to render (set via .src or HATEOAS rel=instances link from schema) */
        get data() {
            return this._data || [];
        }

        /** @param {array} value - contains array of table data to render (set via .src or HATEOAS rel=instances link from schema) */
        set data(value) {
            this._data = value;
            if (this.schema) {
                this.populateTable();
            }
        }

        /** @return {object} JSON v3 Schema used to render table structure (set via .src or HATEOAS rel=describedby link from data object) */
        get schema() {
            return this._schema || null;
        }

        /** @param {object} value - JSON v3 Schema used to render table structure (set via .src or HATEOAS rel=describedby link from data object) */
        set schema(value) {

            this._schema = value;
            this.sortedKeys = getSortedSchemaKeys(value);

            this.createTable();
        }

        /** @return {number} number of rows per page to render (default = 0) */
        get resultsPerPage() {
            return Math.max(this._resultsPerPage, 0);
        }

        /** @param {number} value - number of rows per page to render (default = 0) */
        set resultsPerPage(value) {
            this._resultsPerPage = value;

            if (this.schema && this.data.length > 0) {
                const newData = this.data.slice(0, value);
                this.populateTable(newData);
            }
        }

        /** @return {number} current page number to show (default = -1) */
        get pageNumber() {
            return parseInt(this.getAttribute('page-number') || '-1', 10);
        }

        // noinspection JSUnusedGlobalSymbols
        /** @param {number} value - current page number to show (default = -1) */
        set pageNumber(value) {
            this.setAttribute('page-number', value || '-1');
        }

        /** @return {number} column index to use to sort the table data (default = -1, unsorted) */
        get sortIndex() {
            return parseInt(this.getAttribute('sort-index') || '-1', 10);
        }

        /** @param {number} value - column index to use to sort the table data (default = -1, unsorted) */
        set sortIndex(value) {
            this.setAttribute('sort-index', (typeof value === 'undefined') ? '-1' : value);
        }

        /** @return {Array} column keys to render in order, extracted from schema */
        get sortedKeys() {

            const vals = (this.getAttribute('sorted-keys') || '');

            return (vals !== '') ? vals.split(',') : [];
        }

        // noinspection JSAnnotator
        /** @param {Array|string} value - column keys to render in order, extracted from schema */
        set sortedKeys(value) {
            this.setAttribute('sorted-keys', Array.isArray(value) ? value.join(',') : value);
        }

        /** @return {boolean} if true renders search input and filters table based on search terms */
        get searchable() {
            return (this.getAttribute('searchable') === 'true');
        }

        /** @param {boolean} value - if true renders search input and filters table based on search terms */
        set searchable(value) {
            this.setAttribute('searchable', value);
        }

        /** @return {boolean} is this instance of ca-list currently in the DOM */
        get attached() {
            return (this._attached === true);
        }

        /** @param {boolean} value - is this instance of ca-list currently in the DOM */
        set attached(value) {
            this._attached = value;
        }

        /** @return {number} the count of the number of data rows in the list */
        get dataCount() {
            return parseInt(this.getAttribute('data-count') || '0', 10);
        }

        /** @param {number} value - the count of the number of data rows in the list */
        set dataCount(value) {
            this.setAttribute('data-count', value || '0');
        }

        /**
         * Event that fires when a user clicks a row of data in the table
         * @param {object} data - data object for the row clicked in the table
         * @returns {undefined} nothing
         */
        onrowclick(data) {
            trace('ca-list row clicked');
            trace(this);
            trace(data);
        }

        /**
         * @param {number} [cellIndex=-1] - Cell index to sort the data by
         * @returns {undefined} nothing
         */
        sortTable(cellIndex = -1) {

            if (this.table.rows.length === 0) return;

            const ATTR_DATA_SORT_DIR = 'data-sort-dir';

            const sortIndex = Math.max(cellIndex, this.sortIndex, 0);

            const direction = (this.table.rows[0].cells[sortIndex].getAttribute(ATTR_DATA_SORT_DIR) === 'asc') ? 'desc' : 'asc';
            const rows = this.table.rows;
            let i;
            let l;

            for (i = 0; i < rows.length - 1; i++) {

                for (let j = 1; j < rows.length - (i + 1); j++) {

                    const rowA = rows[j];
                    const rowB = rows[j + 1];
                    const rowACell = rowA.cells[sortIndex];
                    const rowBCell = rowB.cells[sortIndex];
                    let rowACellText = rowACell.getAttribute('data-raw') || rowACell.textContent;
                    let rowBCellText = rowBCell.getAttribute('data-raw') || rowBCell.textContent;

                    // Convert the text to a number if relevant
                    rowACellText = (isNaN(rowACellText * 1)) ? rowACellText.toLowerCase() : rowACellText * 1;
                    rowBCellText = (isNaN(rowBCellText * 1)) ? rowBCellText.toLowerCase() : rowBCellText * 1;

                    switch (direction) {
                        case 'asc':
                            if (rowACellText > rowBCellText) {
                                this.tbody.insertBefore(rowB, rowA);
                            }
                            break;

                        case 'desc':
                            if (rowACellText < rowBCellText) {
                                this.tbody.insertBefore(rowB, rowA);
                            }
                            break;

                        default:
                            break;
                    }
                }
            }

            // remove previous sort attributes
            for (i = 0, l = this.table.rows[0].cells.length; i < l; i++) {
                this.table.rows[0].cells[i].removeAttribute(ATTR_DATA_SORT_DIR);
            }

            // set current sort attribute
            this.table.rows[0].cells[sortIndex].setAttribute(ATTR_DATA_SORT_DIR, direction);
        }

        /**
         * Search the visual HTML table hiding rows that do not match search criteria
         * @param {string} value - search keyword/phrase
         * @returns {undefined} nothing
         */
        filterTableBySearchTerm(value) {

            if (!this.data) return;

            const searchTerm = (value || '').trim().toLowerCase();
            const rowsToKeep = {};
            const properties = this.schema.properties;
            const schemaKeys = Object.keys(properties);

            // remove hidden columns from keys (pointless matching on what the user can not see)
            const keys = schemaKeys.filter(key => (this.querySelector(`th[data-key="${key}"]`) || {}).offsetWidth > 0);

            // go through the data object (capturing the index of matching rows)
            this.data.forEach((item, index) => {

                // go through each property
                // TODO: use functional constructs
                // eslint-disable-next-line guard-for-in, no-restricted-syntax
                for (const key in keys) {

                    const k = keys[key];
                    let itemValue = item[k];

                    // only search the strings
                    if (k !== 'id' && Object.prototype.hasOwnProperty.call(item, k) && !Array.isArray(itemValue)) {

                        // convert to string
                        itemValue = (`${itemValue}`).toLowerCase().trim();

                        // if we find a match, store the row index (so we can match it to the table row via data-index attribute)
                        if (itemValue.indexOf(searchTerm) > -1) {
                            rowsToKeep[index] = true;
                            break;
                        }

                        // check if the format contains date and look at the data in the DOM
                        if (index !== 0 && (properties[k].format || '').indexOf('date') > -1) {
                            const colIndex = schemaKeys.indexOf(k);
                            const cellValue = this.table.rows[index].cells[colIndex].textContent || '';

                            // check the dom, -1 because the dom is always +1 due to rows containing TH
                            if (cellValue.indexOf(searchTerm) > -1) {
                                rowsToKeep[index - 1] = true;
                                break;
                            }
                        }
                    }
                }
            });

            // get a list of rows with data-index attribute
            const rows = Array.prototype.slice.call(this.table.querySelectorAll('tr[data-index]'));

            // go through each row and hide the ones we dont have matching indexes for
            rows.forEach(row => {
                const index = row.getAttribute('data-index');
                const hideRow = !rowsToKeep[index];

                row.setAttribute('data-hidden', hideRow);
            });

            if (searchTerm !== '') {
                this.table.setAttribute('data-hidden-count', this.table.querySelectorAll('tr[data-hidden="true"]').length);
                this.table.setAttribute('data-visible-count', this.table.querySelectorAll('tr[data-hidden="false"]').length);
            } else {
                this.table.removeAttribute('data-hidden-count');
                this.table.removeAttribute('data-visible-count');
            }
        }

        /**
         * Creates an unordered list of data when passed a JavaScript object
         * @example {'name': 'joe burton', 'age': '37', 'dob': '04/10/1979'}
         * @param {object} data - unordered list of data
         * @returns {HTMLElement} unordered list
         */
        static createDataList(data) {

            const ul = document.createElement('ul');

            Object.keys(data).forEach(key => {
                const li = document.createElement('li');
                li.innerText = `${key}: ${data[key]}`;
                ul.appendChild(li);
            });

            return ul;
        }

        /**
         * Loads the .src value via Ajax - can be either a schema/data url.
         * If the request returns a JSON schema, it assigns the .schema property and checks for HATEOAS instances link of which it procecedes to load data
         * If the request returns a JSON list of data, it assigns the .data property and checks for a HATEOAS describedby link of which is proceedes to load the schema
         * @access private
         * @returns {undefined} nothing
         */
        loadSrc() {

            // load the external JSON object
            ajax.execute({ url: this.src, dataType: 'json' }).then(data => {

                if (data) {

                    if (data.$schema) {

                        // store a reference to the schema
                        this.schema = data;

                        // get list of instance urls if we have them
                        const url = this.getHyperSchemaLink(data, 'instances');

                        if (url !== '') {
                            this.loadData(url);
                        }
                    } else if (data.list) {

                        // store a reference to the data
                        this.data = data.list;

                        // get the schema from the json data link
                        const url = this.getHyperSchemaLink(data, 'describedby');

                        if (url !== '') {
                            this.loadSchema(url);
                        }
                    }
                }
            });
        }

        /**
         * Loads the schema from either passed in URL or this.src
         * @access private
         * @param {string?} [url=this.src] - the URL to load instead of this.src
         * @returns {undefined} nothing
         */
        loadSchema(url) {

            const schemaUrl = url || this.src;

            if (schemaUrl !== '') {

                // load the external JSON schema and set this.schema property
                ajax.execute({ url: schemaUrl, dataType: 'json' }).then(schema => {
                    this.schema = schema;
                });
            }
        }

        /**
         * Attempts to find an instance link on the current schema (or passed as a param) and if present, loads and assigns the data
         * @access private
         * @param {string?} url - the URL to load to override the instances link on the current schema
         * @returns {undefined} nothing
         */
        loadData(url) {

            const dataUrl = url || this.getHyperSchemaLink(this.schema, 'instances');

            if (dataUrl !== '') {

                // load the table instance data linked from the attached schema
                ajax.execute({ url: dataUrl, dataType: 'json' }).then(data => {

                    // Setting the data property should trigger a call to populateTable
                    if (data && data.list) {
                        this.data = data.list;
                    }
                });
            }
        }

        /**
         * Internal method to return a HATEOAS link href where rel = rel value passed
         * @access private
         * @param {object} obj - object to inspect
         * @param {string} rel - value to match
         * @returns {string} either an empty string or URL within .href property of related link
         */
        getHyperSchemaLink(obj, rel) {

            // find link matching rel value
            const link = (obj.links || []).find(l => l.rel === rel);

            // return link href if it exists
            return link ? link.href : '';
        }

        /**
         * Internal method to handles child interaction events
         * @access private
         * @param {Event} e, event object from action.
         * @returns {boolean} true, always
         */
        eventDelegate(e = event) {

            const el = e.target || e.srcElement;
            const eType = (e.type || '').toLowerCase();
            const tag = el.tagName.toLowerCase();

            switch (eType) {

                case 'keyup':
                    if (el === this.filterEl) {
                        this.filterTableBySearchTerm(el.value);
                    }
                    break;

                case 'click':

                    if (tag === 'td') {

                        const tr = getParentByAttribute(el, 'tagName', 'TR');

                        if (tr) {

                            const dataIndex = parseInt(tr.getAttribute('data-index'), 10);
                            const dataItem = this.data[dataIndex];

                            if (dataItem) {
                                // execute handler passing this and dataItem as first param
                                this.onrowclick.call(this, dataItem);
                            }
                        }
                    } else if (tag === 'th' || tag === 'span') {

                        let cellIndex = el.cellIndex;

                        if (tag === 'span') {

                            // If click on a SPAN, get hold of the TH parent
                            const th = getParentByAttribute(el, 'tagName', 'TH');
                            cellIndex = th.cellIndex;
                        }

                        // If you click on the same header cell (to change the sort order), the sortIndex/cellIndex value doesn't change
                        if (this.sortIndex === cellIndex) {
                            // So you need to trigger the sorting of the table manually
                            this.sortTable();
                        } else {
                            // Otherwise use the cellIndex of the clicked element to set the new sortIndex
                            this.sortIndex = cellIndex;
                        }
                    }
                    break;

                default:
                    break;
            }

            // allow the event to bubble
            return true;
        }

        /**
         * Internal method to create the HTML table based on the current JSON v3 schema
         * @access private
         * @returns {undefined} nothing
         */
        createTable() {

            // build table headers from schema
            if (this.schema) {

                // remove previous values
                clearElement(this.colgroup);
                clearElement(this.thead);

                const props = this.schema.properties;
                const tblRow = createElement(null, 'tr');

                // go through each property of the schema and add table header cell and form row
                let i = 0;
                const l = this.sortedKeys.length;
                for (; i < l; i++) {

                    const key = this.sortedKeys[i];

                    if (key !== 'links' && key.indexOf('$') === -1 && Object.prototype.hasOwnProperty.call(props, key)) {
                        const item = props[key];

                        // insert col
                        createElement(this.colgroup, 'col', { 'data-key': key });

                        // insert header cell into header row
                        const th = createElement(tblRow, 'th', { 'data-key': key });

                        // insert value within a span to allow us to alter its value via CSS (hide span, insert content before etc)
                        createElement(th, 'span', null, item.title || key);
                    }
                }

                if (tblRow.children.length > 0) {
                    this.thead.appendChild(tblRow);
                }

                if (this.data.length > 0) {
                    this.populateTable();
                }
            }
        }

        /**
         * Internal method to add rows to the table for each item in this.data array where the key matches a key in the current schema.
         * @access private
         * @param {object} [data=this.data] - the data to populate instead of this.data
         * @returns {undefined} nothing
         */
        populateTable(data) {

            const dataToPopulate = data || this.data;

            // build table headers from schema
            if (dataToPopulate) {

                // remove previous data
                clearElement(this.tbody);

                // assign table data
                let i = 0;
                const l = dataToPopulate.length;
                for (; i < l; i++) {

                    const item = dataToPopulate[i];
                    const row = createElement(null, 'tr', { 'data-index': i });
                    const schemaProps = this.schema.properties;

                    //  Go through the schema & add the columns in the order defined by the schema so the table headers match
                    let ii = 0;
                    const ll = this.sortedKeys.length;
                    for (; ii < ll; ii++) {

                        const key = this.sortedKeys[ii];
                        let attrs = null;
                        let dataList = null;
                        let text = '';
                        let format = '';

                        if (key !== 'links' && key.indexOf('$') === -1) {

                            if (Object.prototype.hasOwnProperty.call(schemaProps, key) && Object.prototype.hasOwnProperty.call(item, key)) {

                                format = (schemaProps[key].items && schemaProps[key].items.format) || schemaProps[key].format || '';

                                switch (schemaProps[key].type) {

                                    case 'array':
                                        if (format === 'textarea') {
                                            text = item[key];
                                        } else {
                                            attrs = { 'data-count': item[key].length };
                                            text = `${item[key].length} records`;
                                        }
                                        break;

                                    case 'boolean':
                                        text = (item[key] && 'yes') || 'no';
                                        attrs = { 'data-boolean': item[key] };
                                        break;

                                    case 'integer':
                                        text = parseInt(item[key] || '0', 10);
                                        break;

                                    default: {
                                        const language = componentSupport.getUserLanguage();

                                        switch (format) {

                                            case 'date-time':
                                                attrs = { 'data-raw': item[key] };
                                                text = parseIsoLocalDate(item[key]).toLocaleString(language);
                                                break;

                                            case 'local-date-time':
                                                attrs = { 'data-raw': item[key] };
                                                text = new Date(item[key]).toLocaleString(language);
                                                break;

                                            case 'date':
                                            case 'birth-date':
                                                attrs = { 'data-raw': item[key] };
                                                text = new Date(item[key]).toLocaleDateString(language);
                                                break;

                                            case 'currency':
                                                attrs = { 'data-raw': item[key] };
                                                text = new Intl.NumberFormat(language, {
                                                    style: 'currency',
                                                    currency: item.$currency || 'XXX'
                                                }).format(item[key]);
                                                break;

                                            case 'country': {
                                                const targetCountry = componentSupport.countryData && componentSupport.countryData.where('iso', item[key], true);
                                                text = (targetCountry && targetCountry.name) || item[key];
                                                break;
                                            }

                                            default: {
                                                text = item[key];
                                            }
                                        }
                                    }
                                }
                            } else {
                                text = '';
                            }

                            // don't pass null as a value
                            text = (text === null) ? '' : text;

                            if (typeof text === 'object') {
                                dataList = List.createDataList(text);
                            }

                            createElement(row, 'td', attrs, text, undefined, dataList);
                        }

                    }

                    if (row.children.length > 0) {
                        this.tbody.appendChild(row);
                    }
                }

                // add table count
                this.dataCount = this.table.querySelectorAll('tr').length - 1;
                this.table.setAttribute('data-count', this.dataCount);

                if (!this.sortIndex) {

                    const sortEl = this.table.querySelector('th[data-key="name"]') || this.table.querySelector('th[data-key="title"]');

                    if (sortEl) {
                        this.sortIndex = sortEl.cellIndex;
                    }
                }
            }
        }
    }

    // register this component with the DOM
    document.registerElement('ca-list', List);
});
