define([
    './helpers/component-support.js',
    './helpers/clear-element.js',
    './helpers/create-element-legacy.js',
    './helpers/get-sorted-schema-keys.js',
    './helpers/camel-to-title-case.js',
    'ca-property.js'
], (componentSupport, clearElement, createElement, getSortedSchemaKeys, camelToTitleCase) => {
    /**
     * Summary class for ca-summary web component.
     * @exports ca-summary
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-summary') or included in a HTML page as an element.
     * @extends HTMLElement
     */
    class Summary extends HTMLElement {

        /**
         * Executes when the element is created.
         * Sets default {@link itemsPerCol} to 2 and default {@link type} to <tt>summary</tt>.
         * @returns {void} void
         */
        createdCallback() {
            this.itemsPerCol = 2;
            this.type = 'summary';
        }

        /**
         * Gets the data being displayed.
         * @returns {object} the data being displayed.
         */
        get data() {
            return this._data || []; // TODO: this should not be an empty array
        }

        /**
         * Sets the data being displayed. This should match the {@link schema}
         * @param {object} value - the data to display
         */
        set data(value) {
            this._data = value || []; // TODO: this should not be an empty array
            if (this.schema) {
                this.render();
            }
        }

        /**
         * Gets the number of items to display in each column before creating a new column.
         * @returns {Number} items to display per-column.
         */
        get itemsPerCol() {
            return this._itemsPerCol;
        }

        /**
         * Sets the number of items to display in each column before creating a new column.
         * @param {Number} value - items to display per-column.
         */
        set itemsPerCol(value) {
            this._itemsPerCol = value;
        }

        /**
         * Gets the type (summary, tooltip or card styles are pre-defined), which affects the styling of the summary.
         * This property is reflected onto the <tt>data-type</tt> attribute and defaults to <tt>summary</tt> if not set.
         * @returns {string} the type.
         */
        get type() {
            return this.getAttribute('data-type') || 'summary';
        }

        /**
         * Sets the type (summary, tooltip or card styles are pre-defined), which affects the styling of the summary.
         * This property is reflected onto the <tt>data-type</tt> attribute and defaults to <tt>summary</tt> if not set.
         * @param {string} value - the type
         */
        set type(value) {
            this.setAttribute('data-type', value || 'summary');
        }

        /**
         * Gets the schema to be used to control the data rendering.
         * @returns {object} the JSON schema defining the data
         */
        get schema() {
            return this._schema;
        }

        /**
         * Sets the schema to be used to define the data and control rendering.
         * @param {object} value - the JSON schema defining the data
         */
        set schema(value) {
            const originalSchema = value;

            // resolve all json pointers
            componentSupport
                    .resolveExternalSchemaDefinitions(value)
                    .then(resolvedSchema => {
                        this._schema = resolvedSchema;
                        if (this.data) {
                            this.render();
                        }
                    })
                    // if it fails, restore original schema
                    .catch(() => {
                        this._schema = originalSchema;
                        if (this.data) {
                            this.render();
                        }
                    });
        }

        /**
         * Renders the element.
         * @access private
         * @returns {undefined}
         */
        render() {

            clearElement(this);

            const items = this.createPropertyElements();
            let itemsPerCol = 1;
            let parentEl = createElement(this, 'div');
            let numOfCols = 1;

            items.forEach(item => {
                parentEl.appendChild(item);

                // if we are using col div's, check and create new column if field count exceeded
                if (this.itemsPerCol > 0 && itemsPerCol >= this.itemsPerCol) {

                    // add a new column
                    parentEl = createElement(this, 'div');

                    // reset counter
                    itemsPerCol = 0;

                    // increase col count so we can add an attribute to style it
                    numOfCols++;
                }

                // keep a count of the number of items in this column
                itemsPerCol++;
            });

            if (itemsPerCol === 1) numOfCols--; // We didn't add anything to the new column

            if (numOfCols > 0) {
                this.setAttribute('data-cols', numOfCols);
            }

            // execute event handler to let the listener know render completed (i.e. all dependent data loaded)
            if (this.onrendercomplete) { // TODO: redundant check
                this.onrendercomplete.call(this);
            }
        }

        /**
         * Designed for extension instead of firing a custom event. TODO: fire a custom event.
         * @returns {undefined}
         */
        onrendercomplete() {
            // For extension
        }

        /**
         * Returns an ordered array of data items with values converted based on schema rules.
         * @access private
         * @return {Array} array of ca-property elements
         */
        createPropertyElements() {

            const data = this.data;
            let schema = this.schema;
            // TODO: move this out into a generic function to reduce duplication in ca-list

            schema = schema.properties || schema;

            const results = [];
            const sortedKeys = getSortedSchemaKeys(schema);

            sortedKeys.forEach(key => {
                // skip any properties we dont want to display - TODO use .filter()
                if (key === 'links' || key.indexOf('$') !== -1) return;

                // only process items where both schema and data object have a matching key - TODO check necessity of hasOwnProperty()
                if (Object.prototype.hasOwnProperty.call(schema, key) && Object.prototype.hasOwnProperty.call(data, key)) {

                    const schemaItem = schema[key];
                    const dataItem = data[key];

                    const propertyEl = createElement(null, 'ca-property', {
                        name: key,
                        title: schemaItem.title || camelToTitleCase(key),
                        property: schemaItem,
                        value: dataItem
                    });

                    results.push(propertyEl);
                }
            });

            return results;
        }

    }

    document.registerElement('ca-summary', Summary);
});
