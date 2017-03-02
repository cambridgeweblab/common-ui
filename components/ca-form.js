define([
    './helpers/component-support.js',
    './helpers/create-element-legacy.js',
    './helpers/cancel-event.js',
    './helpers/clear-element.js',
    './helpers/get-sorted-schema-keys.js',
    './helpers/new-guid.js',
    './helpers/validate-against-schema.js',
    './helpers/trace.js',
    './helpers/set-element-value.js',
    './helpers/html-to-dom.js',
    'document-register-element'
], (componentSupport, createElementLegacy, cancelEvent, clearElement, getSortedSchemaKeys, newGuid, validateAgainstSchema, trace, setElementValue, htmlToDom) => {
    /**
     * @exports ca-form
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-form') or included in a HTML page as an element.
     */
    class CaForm extends HTMLElement {

        /**
         * Executes when the element is first created
         * @returns {undefined} nothing
         */
        createdCallback() {

            // always use the first schema in the collection to start
            this.schemaIndex = 0;

            // initialise the title and description properties
            this.title = '';
            this.description = '';

            // keep a handle to the form element
            this.form = createElementLegacy(this, 'form', { action: '', method: 'post', novalidate: 'novalidate' });

            // hook form submit event
            this.form.onsubmit = (e) => {
                cancelEvent(e);
                this.save();
            };

            this.readonly = false;

            this.elements = [];
        }

        /**
         * Called when the component is attached to the DOM
         * @returns {undefined} nothing.
         */
        attachedCallback() {

            const event = new CustomEvent('ca-config-component', {
                detail: {
                    config: [
                        { name: 'remote-image-capture', localName: 'remoteImageCapture', type: 'property' }
                    ],
                    component: this
                },
                bubbles: true
            });

            this.dispatchEvent(event);

            if (this.src) {
                this.loadSchema();
            }
        }

        /**
         * @description Executes when any attribute is changed on the element
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {undefined} nothing.
        */
        attributeChangedCallback(attrName, oldVal, newVal) {

            // Only need to re-render the component if the attrbute value has changed
            if (oldVal !== newVal) {

                switch (attrName) {

                    case 'columns':
                    case 'placeholder-maxlength': {
                        this.render();
                    } break;
                    default: break;
                }
            }
        }

        /** @return {string} gets the create-url value */
        get createUrl() {
            return this.getAttribute('create-url');
        }

        /** @param {string} value, sets the create-url string */
        set createUrl(value) {
            this.setAttribute('create-url', value);
        }

        /** @return {string} gets the src string */
        get src() {
            return this.getAttribute('src');
        }

        /** @param {string} value - sets src value */
        set src(value) {
            this.setAttribute('src', value);
            this.loadSchema();
        }

        /** @return {string} gets the updateUrl string */
        get updateUrl() {
            return this.getAttribute('update-url');
        }

        /** @param {string} value, sets the update-url string */
        set updateUrl(value) {
            this.setAttribute('update-url', value);
        }

        /** @return {string} gets the create-method string */
        get createMethod() {
            return this.getAttribute('create-method');
        }

        /** @param {string} value, sets the create-method string */
        set createMethod(value) {
            this.setAttribute('create-method', value);
        }

        /** @return {string} gets the component data */
        get data() {
            return this._data;
        }

        /** @param {object} value, sets the component data */
        set data(value) {

            this._data = value;

            const updateInfo = (this.data.links || []).find(link => link.rel === 'self');

            if (updateInfo) {
                this.updateUrl = updateInfo.href;
            }

            this.populate();
        }

        /** @return {object} gets the component schema */
        get schema() {
            return this._schema;
        }

        /** @param {object} value, sets the component schema */
        set schema(value) {
            this._schema = value;
            this.render();
        }

        /** @return {boolean} schema index */
        get schemaIndex() {
            return this._schemaIndex;
        }

        /** @param {object} value, sets the schema index */
        set schemaIndex(value) {
            this._schemaIndex = value;
        }

        /** @return {object} a schema */
        get selectedSchema() {
            return this.schema[this.schemaIndex];
        }

        /** @return {boolean} number */
        get columns() {
            return parseInt(this.getAttribute('columns') || '0', 10);
        }

        /** @param {boolean} value, sets the value */
        set columns(value) {
            this.setAttribute('columns', value || '0');
        }

        /** @return {boolean} check if readonly */
        get readonly() {
            return this.getAttribute('readonly') === 'true';
        }

        /** @param {boolean} value, set readonly value */
        set readonly(value) {

            if (value) {
                this.setAttribute('readonly', value);
            } else {
                this.removeAttribute('readonly');
            }
        }

        /** @return {boolean} value, get placeholderMaxLength value */
        get placeholderMaxLength() {
            return parseInt(this.getAttribute('placeholder-maxlength') || '75', 10);
        }

        /** @param {boolean} value, set placeholderMaxLength value */
        set placeholderMaxLength(value) {
            this.setAttribute('placeholder-maxlength', value);
        }

        /** @return {string} gets the title */
        get title() {
            return this._title || '';
        }

        /** @param {string} value, set title */
        set title(value) {
            this._title = value || '';
        }

        /** @return {string} gets the description */
        get description() {
            return this._description || '';
        }

        /** @param {string} value, set the description */
        set description(value) {
            this._description = value || '';
        }

        /** @return {array} gets the buttons */
        get buttons() {
            return this._buttons || [];
        }

        /** @param {array} value, set the buttons */
        set buttons(value) {
            this._buttons = value || [];
            this.render();
        }

        /** @return {string} gets the persist value */
        get persist() {
            return this._persist;
        }

        /** @param {string} value, sets the persist value */
        set persist(value) {
            this._persist = (value === true);
        }

        /** @return {string} gets the mode value */
        get mode() {
            return this.getAttribute('mode') || 'edit';
        }

        /** @param {string} value, sets the mode value */
        set mode(value) {
            this.setAttribute('mode', value);
        }

        /** @return {booleam} gets the disable-validation value */
        get disableValidation() {
            return (this.getAttribute('disable-validation') === 'true');
        }

        /** @param {string} value, sets the disable-validation value */
        set disableValidation(value) {
            this.setAttribute('disable-validation', value === true);
        }

        /** @return {string} gets the remoteImageCapture value */
        get remoteImageCapture() {
            return this._remoteImageCapture;
        }

        /** @param {string} value, sets the remoteImageCapture value */
        set remoteImageCapture(value) {
            this._remoteImageCapture = value === 'true';
        }

        /** @return {string} gets thew reset value */
        get reset() {
            return this.getAttribute('reset');
        }

        /** @param {string} value, gets the reset value */
        set reset(value) {
            return this.setAttribute('reset', value);
        }

        /**
         * @description Loads the schema
         * @returns {undefined} nothing.
        */
        loadSchema() {

            const schemaUrl = this.src;

            return componentSupport.request({ url: schemaUrl, dataType: 'json' }).then(data => {
                this._schema = [data];
                this.render();

                // fire on schema loaded event
                this.onschemaloaded(data.title || '', data);

                // apply session stored form data if it exists
                if (this.persist && window.sessionStorage && sessionStorage[this.src]) {

                    const formData = sessionStorage[this.src] || '';

                    if (formData !== '') {
                        this.populate(JSON.parse(formData));
                    }
                }
            }).catch(err => {
                trace(`Schema not found! ${err}`);
            });
        }

        /**
         * @description Builds the HTML form based on the value of the assigned JSON .schema object
         * @returns {void} nothing.
        */
        render() {

            // build table headers from schema
            if (this._schema) {

                // erase current form
                clearElement(this.form);

                // grab a handle to elements for rendering
                const schema = this.selectedSchema;
                let itemIndex = 1;
                let group = '';
                const schemaTitle = this._title || schema.title || '';
                const schemaDesc = this._description || (Array.isArray(schema.description) ? schema.description.join('') : schema.description || '');

                // insert title if it has one
                if (schemaTitle !== '') {
                    createElementLegacy(this.form, 'h2', { 'data-schema-title': schemaTitle }, null, schemaTitle);
                }

                if (schemaDesc !== '') {
                    createElementLegacy(this.form, 'div', { class: 'ca-form-desc', 'data-schema-description': schemaDesc }, null, schemaDesc);
                }

                // add the selected schema to the form element
                this.form.setAttribute('data-schema-type', schema.title);

                // add schema option if more than one exist
                if (this.schema.length > 1) {

                    // create a form label container (acts as a row)
                    const label = createElementLegacy(null, 'label', { for: 'schemaType', 'data-key': 'schemaType' });

                    // create form field name
                    createElementLegacy(label, 'span', null, 'Type');

                    const select = createElementLegacy(label, 'select', { name: 'schemaType', id: 'schemaType' });

                    for (let i = 0, l = this.schema.length; i < l; i++) {
                        const option = createElementLegacy(select, 'option', { value: this.schema[i].title }, this.schema[i].title);

                        if (i === this.schemaIndex) {
                            option.selected = true;
                        }
                    }

                    // switch schemas on schema type change
                    select.onchange = () => {
                        this.schemaIndex = select.selectedIndex;
                        this.render();
                    };

                    // add to form
                    this.form.appendChild(label);
                }

                const properties = schema.properties;
                let orderedKeys = getSortedSchemaKeys(schema);
                let itemsPerCol = 1;
                let columnCount = 0;
                let parentEl = this.form;

                // if multi columns specified
                if (this.columns > 1) {
                    group = createElementLegacy(this.form, 'fieldset');
                    parentEl = createElementLegacy(group, 'div', { class: 'group' });
                }

                // remove keys we're not interested in
                orderedKeys = orderedKeys.filter(key =>
                    (key !== 'links' && key.indexOf('$') === -1 && Object.prototype.hasOwnProperty.call(properties, key))
                );

                const len = orderedKeys.length;
                let maxItemsPerCol = (this.columns > 1) ? len / this.columns : 0;

                // go through each property of the schema and add form elements
                for (let i = 0; i < len; i++) {

                    const key = orderedKeys[i];
                    const item = properties[key];
                    let css = (item.required) ? 'required' : '';

                    // add a class modifier if the field type is bool so we can inline checkboxes
                    css += (item.type === 'boolean') ? ' bool' : '';

                    // create a form label container (acts as a row)
                    const label = createElementLegacy(null, 'label', { for: key, 'data-key': key, class: css });

                    if (item.format) {
                        label.setAttribute('data-format', item.format);
                    }

                    if (item.type) {
                        label.setAttribute('data-type', item.type);
                    }

                    // create form field name
                    createElementLegacy(label, 'span', null, item.title || key);

                    // convert schema item to html input item
                    let inputEl = this.schemaItemToHtmlElement(key, item);

                    if (inputEl) {

                        const isHidden = (inputEl.type === 'hidden');

                        // if ca-form is readonly, apply same to elements and dont enable validation
                        if (this.readonly) {

                            inputEl.setAttribute('readonly', 'true');
                        } else if (!isHidden) {

                            // set focus to the first item
                            if (itemIndex === 1) {
                                inputEl.setAttribute('autofocus', 'true');
                            }

                            // validate on blur
                            inputEl.onblur = () => {
                                if (inputEl.type !== 'checkbox') {
                                    setTimeout(() => this.validateField(item.id, item.value), 250);
                                }
                            };
                        }

                        if (!isHidden) {

                            if (this.mode === 'override') {
                                // Wrap the inputEl in an override.
                                const overrideEl = createElementLegacy(null, 'ca-override', { name: key });
                                overrideEl.property = item;
                                overrideEl.appendChild(inputEl);
                                inputEl = overrideEl;
                            }

                            const itemDesc = item.description || '';
                            const itemDescHasHtml = /<[^>]*>/gi.test(itemDesc || '');

                            // if it contains html
                            if (itemDescHasHtml) {

                                // inject as safe HTML
                                const descEl = createElementLegacy(label, 'i', { class: 'ca-field-desc' });

                                htmlToDom(itemDesc, descEl);
                                // or has length over placeholder max length characters
                            } else if (itemDesc.length >= this.placeholderMaxLength) {

                                // inject as text
                                createElementLegacy(label, 'i', { class: 'ca-field-desc' }, itemDesc);
                            }

                            // add input to form label
                            label.appendChild(inputEl);

                            // add row to form
                            parentEl.appendChild(label);
                        } else {
                            parentEl.appendChild(inputEl);
                        }

                        if (this.columns > 1 && itemsPerCol >= maxItemsPerCol && itemIndex < len) {

                            // add a new column
                            group = createElementLegacy(this.form, 'fieldset');
                            parentEl = createElementLegacy(group, 'div', { class: 'group' });

                            // increase the column count
                            columnCount++;

                            // adjust the maxItemsPerCol on the basis of how many items are left to render across the remaining columns
                            maxItemsPerCol = (len - itemIndex) / (this.columns - columnCount);

                            // reset counter
                            itemsPerCol = 0;
                        }
                    } else {
                        trace(`In ca-form.render(): Failed to convert schema item to html element (key: ${key})`);
                    }

                    // keep a count of the number of items added
                    itemIndex++;

                    // keep a count of the number of items in this column
                    itemsPerCol++;

                    // add input element to the elements collection so we can keep a track of all editable children
                    this.elements.push(inputEl);
                }

                // disable all child controls if the form is readonly
                if (this.readonly) {

                    const inputs = Array.prototype.slice.call(this.form.querySelectorAll('input,select,textarea'));

                    inputs.forEach(item => {
                        item.setAttribute('disabled', 'true');
                    });
                }

                // if the user can create, render a save button
                const createLink = schema.links && schema.links.find(link => link.rel === 'create');
                let resetButton = null;
                let buttonContainer = null;

                if (createLink) {

                    // set create/update urls
                    this.createUrl = createLink.href;
                    this.createMethod = createLink.method || 'POST';

                    const createSchema = createLink.properties;

                    // if we have a schema of items, add them to the url
                    // TODO: rewrite this to better handle schemas (hacked in for the demo)
                    // We can now handle parameterized schemas on ca-list for instances, so make use of that.
                    if (createSchema) {
                        // eslint-disable-next-line no-restricted-syntax
                        for (const key in createSchema) {

                            if (Object.prototype.hasOwnProperty.call(createSchema, key) && this.createUrl.indexOf(`{${key}}`)) {

                                const schemaItem = createSchema[key];

                                // if we have a required guid, add one
                                if (schemaItem.required && schemaItem.format === 'uuid') {
                                    this.createUrl = this.createUrl.replace(`{${key}}`, newGuid());
                                }
                            }
                        }
                    }

                    // insert button container
                    buttonContainer = createElementLegacy(this.form, 'div', { class: 'buttons' });

                    // add submit button
                    createElementLegacy(buttonContainer, 'input', { type: 'submit', value: createLink.title || 'Save' });

                    // add reset button if we have it.
                    if (this.reset) {
                        resetButton = createElementLegacy(buttonContainer, 'input', { name: 'reset', type: 'button', value: 'Reset' });
                        resetButton.onclick = () => {
                            this.src = this.src;
                        };
                    }
                }

                // add buttons from array if we have them
                if (this.buttons.length > 0) {

                    if (!buttonContainer) {

                        // insert button container if it does not already exist
                        buttonContainer = createElementLegacy(this.form, 'div', { class: 'buttons' });
                    }

                    // add a button for each item in the array
                    for (let i = 0, l = this.buttons.length; i < l; i++) {

                        // insert button
                        const button = createElementLegacy(buttonContainer, 'input', { type: 'button', value: this.buttons[i] });

                        // bubble click event passing button display value to external handler
                        button.onclick = (e) => {
                            cancelEvent(e);
                            this.onbuttonclick(button.value);
                        };
                    }
                }

                // fire onrendercomplete providing all child elements have finished rendering
                this.checkRenderComplete();
            }
        }

        /**
         * @description Goes through all input elements and checks if a rendered property exists and is true
         * if not, checks again every 250ms eventually firing the onrendercomplete event once all children are considered rendered
         * @returns {Boolean} checks all properties rendered.
         */
        checkRenderComplete() {

            const unrenderedElements = this.elements.filter(item =>
                (item && item.rendered !== undefined && !item.rendered)
            );

            if (unrenderedElements.length <= 0) {
                // all child elements are considered rendered, fire render complete event
                if (this.onrendercomplete) {
                    this.onrendercomplete();
                }
            } else {
                // still waiting for children to finish rendering, call back in 250ms
                setTimeout(() => this.checkRenderComplete(), 250);
            }
        }

        /**
         * @description Returns a JSON object containing form data
         * @returns {Object} containing the form data
         */
        getData() {

            const schema = this.selectedSchema.properties;
            const formData = {};

            // go through the schema and get the form values
            // eslint-disable-next-line no-restricted-syntax
            for (const key in schema) {

                if (key !== 'links' && key.indexOf('$') === -1 && Object.prototype.hasOwnProperty.call(schema, key)) {

                    // this is the schema item not the element itself
                    const schemaItem = schema[key];

                    if (!schema[key].readonly) {

                        const element = this.querySelector(`[name="${key}"]`);

                        if (element) {

                            switch (schemaItem.type) {

                                case 'array': {

                                    if (schemaItem.items.format === 'textarea') {
                                        formData[key] = (element.value !== '') ? element.value.split('\n') : [];
                                    } else if (schemaItem.items.format === 'list') {
                                        formData[key] = element.value; // returns an array
                                    } else if (schemaItem.items.format === 'uri') {
                                        formData[key] = element.data;
                                    } else if (Array.isArray(element.value)) {
                                        formData[key] = element.value;
                                    } else if (schemaItem.items.type === 'object') {
                                        // It's an upload control
                                        formData[key] = element.data;
                                    } else {
                                        formData[key] = element.value;
                                    }

                                } break;

                                case 'boolean': {
                                    formData[key] = (element.checked);
                                } break;

                                case 'integer': {
                                    formData[key] = element.value ? parseInt(element.value, 10) : '';
                                } break;

                                case 'number': {
                                    formData[key] = element.value ? parseFloat(element.value) : '';
                                } break;

                                default: {

                                    switch (schemaItem.format) {

                                        case 'file':
                                        case 'multi-file': {

                                            formData[key] = element.value;
                                        } break;

                                        default: {

                                            formData[key] = (element.value || '').trim();

                                            if (schemaItem.format && schemaItem.format === 'currency' && !formData.$currency) {
                                                formData.$currency = componentSupport.getUserCurrency().code;
                                            }
                                        }
                                    }

                                }
                            }
                        }

                        // remove empty strings
                        if (!schemaItem.required && formData[key] === '') {
                            delete formData[key];
                        }
                    } else {

                        // Required, read-only value will keep its existing value since the form will not allow entry.
                        formData[key] = (this.data && this.data[key]) || (schemaItem.required && schemaItem.default) || undefined;
                    }
                }

            }

            return formData;
        }

        /**
         * @description Returns a JSON object containing form data
         * @returns {Object} containing the raw schema data
        */
        getRawData() {

            const schema = this.selectedSchema.properties;
            const formData = {};

            // go through the schema and get the form values
            // eslint-disable-next-line no-restricted-syntax
            for (const key in schema) {

                if (key !== 'links' && key.indexOf('$') === -1 && !schema[key].readonly && Object.prototype.hasOwnProperty.call(schema, key)) {

                    const item = schema[key];
                    const element = this.querySelector(`[name="${key}"]`);

                    if (element) {

                        switch (item.type) {

                            case 'array': {

                                if (item.items.format === 'uri' || item.items.type === 'object') {
                                    formData[key] = element.data;
                                } else {
                                    formData[key] = element.value;
                                }

                            } break;

                            case 'boolean': {
                                formData[key] = (element.checked);
                            } break;

                            default: {

                                formData[key] = (element.value || '').trim();

                                if (item.format && item.format === 'currency' && !formData.$currency) {
                                    formData.$currency = componentSupport.getUserCurrency().code;
                                }
                            }
                        }
                    }
                }
            }

            return formData;
        }

        /**
         * @description clears validation errors
         * @returns {void} nothing
        */
        clearValidationErrors() {

            // clear previous validation errors
            this.form.removeAttribute('data-error');

            Array.prototype.slice.call(this.querySelectorAll('[data-error]')).forEach(item =>
                item.removeAttribute('data-error')
            );
        }

        /**
         * @description sets an error
         * @param {string} fieldName name of field to set error on
         * @param {error} error passed
         * @returns {void} nothing
        */
        setError(fieldName, error) {

            if (error !== '') {

                const el = this.querySelector(`[name="${fieldName}"]`);

                if (el) {
                    // mark field as invalid
                    el.setAttribute('data-invalid', 'true');
                    el.parentNode.setAttribute('data-error', error);
                }
            }
        }

        /**
         * @description clears an error
         * @param {string} fieldName name of field to set error on
         * @returns {void} nothing
        */
        clearError(fieldName) {

            const el = this.querySelector(`[name="${fieldName}"]`);

            if (el) {
                el.removeAttribute('data-invalid');
                el.parentNode.removeAttribute('data-error');
            }
        }

        /**
         * @description Executes validation for an individual field
         * @param {string} key, field in schema data
         * @param {string} value, value from the item
         * @returns {void} nothing
         */
        validateField(key, value) {

            // create fake data object
            const dataItem = {};

            // populate key
            dataItem[key] = value;

            // execute regular form validation but passing a single property to test
            this.isValid(dataItem);
        }

        /**
         * @description Returns true if form data is valid, otherwise false. Also updates the UI with any validation errors
         * @param {Object} data, form data
         * @returns {Boolean} if it's a valid object or not
         */
        isValid(data) {

            // if validation has been disabled (for example, the Form Builder doesn't want/need it)
            if (this.disableValidation === true) {
                // then simply return true to indicate the form data is "valid"
                return true;
            }

            // if a data object is not passed, get the current values
            // eslint-disable-next-line no-param-reassign
            data = data || this.getData();
            const schema = this.selectedSchema;
            let valid = true;

            // eslint-disable-next-line no-restricted-syntax
            for (const key in data) {

                // ensure data and schema have matching key!
                if (Object.prototype.hasOwnProperty.call(data, key) && Object.prototype.hasOwnProperty.call(schema.properties, key)) {

                    // if the item has a regex patter, grab the raw string - we do this because parseInt strips zero's
                    const inputEl = this.querySelector(`[name="${key}"]`);

                    let value = (schema.properties[key].pattern) ? (inputEl && inputEl.value) || data[key] : data[key];

                    value = (typeof value === 'string') ? value.trim() : value;

                    const error = validateAgainstSchema(schema, key, value);

                    if (error) {
                        this.setError(key, error);
                        valid = false;
                    } else {
                        this.clearError(key);
                    }
                }
            }

            // update session stored form data
            if (this.persist && window.sessionStorage) {
                sessionStorage[this.src] = JSON.stringify(this.getRawData());
            }

            return valid;
        }

        /**
         * @description Saves the form data back to the server
         * @returns {void} nothing
         */
        save() {

            const createUrl = this.getAttribute('create-url') || '';
            const updateUrl = this.getAttribute('update-url') || '';
            const formData = this.getData();

            this.clearValidationErrors();

            // exit if not valid
            if (!this.isValid(formData)) return false;

            // execute update or create request
            if (updateUrl !== '') {
                componentSupport.request({
                    url: updateUrl,
                    type: 'PUT',
                    dataType: 'json',
                    data: formData,
                    contentType: 'application/json'
                })
                    .then(data => {

                        trace('Existing record created.');

                        // get next schema from response is present
                        const next = ((data || {}).links || []).find(link => link.rel === 'next');

                        // if event handler returns true and we have a next object, load the next step
                        if (this.onupdate.call(this, data, next) && next) {
                            this.src = next.href;
                        }
                    }, err => {
                        trace('Error updating existing record', err);
                    });
            } else if (createUrl !== '') {
                componentSupport.request({
                    url: createUrl,
                    type: this.createMethod,
                    dataType: 'json',
                    data: formData,
                    contentType: 'application/json'
                })
                    .then(data => {

                        trace('New record created.');

                        // get next schema from response is present
                        const next = ((data || {}).links || []).find(link => link.rel === 'next');

                        // if event handler returns true and we have a next object, load the next step
                        if (this.oncreate.call(this, data, next) && next) {
                            this.src = next.href;
                        }
                    }, err => {
                        trace('Error creating new record', err);
                    });
            } else {
                this.onsave.call(this, formData); // @todo ... this method does not appear in weblab-common-ui...
            }

            return true;

        }

        /**
         * @description Event handler fired when a record is created (return true to continue with next step)
         * @param {object} data - json data that was sent to the server
         * @param {object} next - next hateoas link returned from creation (if present)
         * @returns {boolean} true always
         */
        oncreate() {
            return true;
        }

        /**
         * @description Event handler fired when a record is update (return true to continue with next step)
         * @param {object} data - json data that was sent to the server
         * @param {object} next - next hateoas link returned from update (if present)
         * @returns {boolean} true always
         */
        onupdate() {
            return true;
        }

        /**
         * @description is an empty function
         * @param {string} label describing item
         * @returns {void} nothing nada
         */ // eslint-disable-next-line no-unused-vars
        onbuttonclick(label) {

        }

        /**
         * @description is an empty function
         * @returns {void} nothing nada
         */
        onrendercomplete() {

        }

        /**
         * @description is an empty function
         * @returns {void} nothing nada
         */
        onpopulatecomplete() {

        }

        /**
         * @description Event handler fired when a schema loads
         * @returns {void} nothing nada
         */
        onschemaloaded() {

        }

        /**
         * @description Go through the data, for each key get the element and set it's value based on element type
         * @param {object} data - data to bind to the form (defaults to internal data value)
         * @returns {void} nothing
         */
        populate(data) {

            // eslint-disable-next-line no-param-reassign
            data = data || this.data;

            // eslint-disable-next-line no-restricted-syntax
            for (const key in data) {
                if (key !== 'links' && key.indexOf('$') === -1 && Object.prototype.hasOwnProperty.call(data, key)) {

                    const el = this.querySelector(`[name="${key}"]`);
                    const value = (typeof data[key] !== 'undefined') ? data[key] : '';

                    if (!el) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }

                    setElementValue(el, value);
                }
            }

            this.onpopulatecomplete();
        }

        /**
         * @description create readonly items
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @param {string} value - value to set to the item
         * @returns {object} dom object
         */
        createReadOnly(type, key, schema, format, value) {

            return (schema.readonly) ? (createElementLegacy(null, 'ca-property', { name: key, id: key, property: schema, value })) : (null);
        }

        /**
         * @description create checkbox for element
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @returns {object} dom object
         */
        createBool(type, key) {

            return (type === 'boolean') ? createElementLegacy(null, 'input', { name: key, id: key, type: 'checkbox', value: '' }) : null;
        }

        /**
         * @description create checkbox for element
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createEmail(type, key, schema, format) {

            return (format === 'email') ? createElementLegacy(null, 'input', { name: key, id: key, type: 'email', value: '' }) : null;
        }

        /**
         * @description creates a radio group element
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createRadioGroup(type, key, schema, format) {

            let el = null;

            if (format === 'radio') {

                el = createElementLegacy(null, 'ca-radio-group', {});
                el.data = schema.extends[0];
                el.name = key;
            }

            return el;
        }

        /**
         * @description create select menu
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createList(type, key, schema, format) {

            let el = null;

            // create a ca-select element if the format is country or list OR the schema is an enum or an Array of enums
            if (format === 'country' || format === 'list' || (schema.enum || (Array.isArray(schema.type) && schema.type.length && schema.type[0].enum))) {
                const multiSelect = (schema.type === 'array' && format === 'list');

                // if it's an array, get the subtype
                // eslint-disable-next-line no-param-reassign
                schema = (schema.type === 'array' && schema.items) ? schema.items : schema;

                // set up the base attributes for the ca-select element
                const attrs = {
                    name: key,
                    id: key,
                    multiple: multiSelect
                };

                // if the schema is extended
                if (schema.extends && schema.extends[0]) {
                    // and the extended schema contains a reference
                    if (schema.extends[0].$ref) {
                        // then use this reference to set the "src" property in order to resolve the reference
                        attrs.src = schema.extends[0].$ref;
                    } else {
                        // otherwise use the extended schema
                        attrs.schema = schema.extends[0];
                    }
                } else {
                    // schema is not extended so simply use the base schema
                    attrs.schema = schema;
                }

                // create a ca-select element with the specified attributes
                el = createElementLegacy(null, 'ca-select', attrs);

                if (format === 'country') {

                    // whenever the country changes, update telephone prefix (if not already set by user)
                    el.onupdate = function (data) {

                        // get all telephone controls
                        const telEls = Array.prototype.slice.call(this.querySelectorAll('ca-tel'));

                        // update each control (we'll add a property to ca-tel at some point)
                        telEls.forEach(item => {

                            // if the idd code can be synchronised with the country code on the page
                            if (item.iddSynch) {
                                // then synchronise the new country code and validate it
                                // eslint-disable-next-line
                                item.countryCode = data.value;
                                setTimeout(() => this.validateField(item.id, item.value), 250);
                            }
                        });
                    };

                }

            }

            return el;
        }

        /**
         * @description create a ca-list-builder
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @returns {object} dom object
         */
        createListBuilder(type, key, schema) {

            let el = null;

            if (schema.type === 'array' && schema.items && (schema.items.extends || schema.items.links)) {
                el = createElementLegacy(null, 'ca-list-builder', { name: key, id: key, layout: 'sidebyside' });
                el.schema = schema.items;
            }

            return el;
        }

        /**
         * @description create a ca-remote-image-capture
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @returns {object} dom object
         */
        createImageCapture(type, key, schema) {

            let el = null;

            if (schema.media && schema.media.type === 'image/jpeg' && schema.media.binaryEncoding === 'base64') {
                // TODO: tech debt, user mapper or similar instead
                if (this.remoteImageCapture) {
                    el = createElementLegacy(null, 'ca-remote-image-capture', { name: key, id: key });
                } else {
                    el = createElementLegacy(null, 'ca-image-capture', { name: key, id: key });
                }
                el.schema = schema.items;
            }

            return el;
        }

        /**
         * @description create select menu
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createIntSelect(type, key, schema, format) {

            let el = null;

            if (format === 'list' && (type === 'number' || type === 'integer')
                && Number.isInteger(schema.minimum) && Number.isInteger(schema.maximum)) {

                el = createElementLegacy(null, 'select', { name: key, id: key });
                createElementLegacy(el, 'option', { value: '' });

                for (let i = schema.minimum; i <= schema.maximum; i++) {
                    createElementLegacy(el, 'option', { value: i }, i);
                }
            }

            return el;
        }

        /**
         * @description create a ca-rating dom element
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createRating(type, key, schema, format) {

            let element = null;

            if (format === 'rating') {
                element = createElementLegacy(document.body, 'ca-rating', { name: key, id: key, from: schema.minimum, to: schema.maximum });
            }

            return element;
        }

        /**
         * @description create a ca-object-list dom element
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createObjectList(type, key, schema) {

            let el = null;

            if (schema.type === 'array' && type === 'object' && /* NASTY HACK */ key !== 'list') {
                // TODO: combine this with the ca-import functionality below and make it a table editor with upload functionality
                el = createElementLegacy(null, 'ca-object-list', { name: key, id: key, title: schema.title });
                el.schema = schema.items;
            }

            return el;
        }

        /**
         * @description create a ca-array-input dom element
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createItemArray(type, key, schema) {

            const checkType = schema.type === 'array' && schema.items && schema.items.type;
            const checkFormat = schema.items && schema.items.format !== 'textarea' && schema.items.format !== 'file' && schema.items.format !== 'multi-file' && type !== 'object';
            let el = null;

            if (checkType && checkFormat) {

                el = createElementLegacy(null, 'ca-input-array', { name: key, id: key, type: schema.items.type, pattern: schema.items.pattern });
                if (schema.items.divisibleBy) el.divisibleBy = schema.items.divisibleBy;
                if (schema.items.multipleOf) el.divisibleBy = schema.items.multipleOf;
                if (schema.items.min) el.min = schema.items.min;
                if (schema.items.max) el.max = schema.items.max;
                if (schema.items.pattern) el.pattern = schema.items.pattern;

            }

            return el;
        }

        /**
         * @description create a default form dom element
         * @param {string} type - type of object
         * @param {string} key - item object key
         * @param {object} schema - the form schema
         * @param {string} format - type of item
         * @returns {object} dom object
         */
        createDefault(type, key, schema, format) {

            let el = null;

            switch (type) {

                case 'number':
                case 'integer': {
                    el = createElementLegacy(null, 'input', { name: key, id: key, type: 'number', value: '' });
                } break;

                case 'object': {
                    if (schema.type === 'array') {

                        const keys = Object.keys(schema.items.properties);

                        const descriptions = keys.map(item =>
                            (schema.items.properties[item].description || '')
                        );

                        const headers = keys.map(() =>
                            (key + (schema.items.properties[key].required ? '*' : ''))
                        );

                        // Upload!
                        el = createElementLegacy(null, 'ca-import', { name: key, id: key, type: 'xlsx', schema: schema.items });
                        el.headers = headers;
                        el.firstRow = descriptions; // descriptions are used as first example row in download template
                    }
                } break;

                default: {

                    // switch types for special formats or fallback to type text
                    switch (format.toLowerCase()) {

                        case 'file': {
                            el = createElementLegacy(null, 'ca-file-input', {
                                name: key,
                                id: key,
                                type: 'file',
                                value: '',
                                mediatype: schema.mediaType || '',
                                maxLength: schema.maxLength
                            });
                        } break;

                        case 'multi-file': {
                            el = createElementLegacy(null, 'ca-file-input', {
                                name: key,
                                id: key,
                                type: 'file',
                                value: '',
                                mediatype: schema.mediaType || '',
                                multiple: true,
                                maxLength: schema.maxLength
                            });
                        } break;

                        case 'barcode-scanner': {
                            el = createElementLegacy(null, 'ca-barcode-scanner', { name: key, id: key, title: schema.title });
                        } break;

                        case 'confirm-email': {
                            el = createElementLegacy(null, 'ca-confirm-input', { name: key, id: key, type: 'email', label: schema.title || key });
                        } break;

                        case 'uri': {
                            el = createElementLegacy(null, 'input', { name: key, id: key, type: 'url', value: '' });
                        } break;

                        // the .value of this component returns the UI path captures by reading the dom elements
                        case 'current-view-context': {
                            el = createElementLegacy(null, 'ca-context', { name: key, id: key });
                        } break;

                        case 'local-date-time': {
                            el = createElementLegacy(null, 'ca-datetime', { name: key, id: key, type: 'datetime-local' });
                        } break;

                        case 'birth-date': {
                            el = createElementLegacy(null, 'ca-datetime', { name: key, id: key, type: 'birth-date' });
                        } break;

                        case 'date-time': {
                            el = createElementLegacy(null, 'ca-datetime', { name: key, id: key, type: 'datetime' });
                        } break;

                        case 'date': {
                            el = createElementLegacy(null, 'ca-datetime', { name: key, id: key, type: 'date' });
                        } break;

                        case 'time': {
                            el = createElementLegacy(null, 'ca-datetime', { name: key, id: key, type: 'time' });
                        } break;

                        case 'phone': {
                            el = createElementLegacy(null, 'ca-tel', { name: key, id: key });
                            el.data = componentSupport.getTelephoneCodes();
                        } break;

                        case 'currency': {
                            el = createElementLegacy(null, 'ca-currency', { name: key, id: key });
                            el.setAttribute('symbol', componentSupport.getUserCurrency().symbol); // TODO: use existing currency on data
                        } break;

                        case 'textarea': {
                            el = createElementLegacy(null, 'textarea', { name: key, id: key, value: '', rows: 3 });
                        } break;
                        default: {
                            el = createElementLegacy(null, 'input', { name: key, id: key, type: 'text', value: '' });
                        }
                    }
                }
            }

            return el;
        }

        /**
         * @description Converts a JSON schema property into a HTML input element
         * @param {string} key - item object key
         * @param {object} item - the form schema
         * @returns {object} dom object
         */
        schemaItemToHtmlElement(key, item) {

            const dataType = (item.items && item.items.type) || item.type;
            const format = (item.items && item.items.format || item.format || '').toLowerCase();
            const itemDesc = item.description || '';
            const itemDescHasHtml = /<[^>]*>/gi.test(itemDesc || '');
            let el = null;
            let value = null;

            // TODO: rewrite this method to make it more efficent!
            // TODO: add support for time|datetime|date|diviibleby
            const creators = [
                this.createReadOnly,
                this.createBool,
                this.createEmail,
                this.createIntSelect,
                this.createRating,
                this.createRadioGroup,
                this.createList,
                this.createListBuilder,
                this.createObjectList,
                this.createImageCapture,
                this.createItemArray,
                this.createDefault
            ];

            for (let i = 0, l = creators.length; i < l; i++) {
                if (this.data) {
                    value = this.data[key];
                }
                el = creators[i].call(this, dataType, key, item, format.split(':')[0], value);
                if (el) break;
            }

            if (el) {

                // disable autocomplete for all input items
                el.setAttribute('autocomplete', 'off');

                // assign validation if present
                if (item.readonly) el.setAttribute('readonly', 'readonly');
                if (item.required) el.setAttribute('required', 'required');
                if (item.pattern) el.setAttribute('pattern', item.pattern);
                if (item.min) el.setAttribute('min', item.min);
                if (item.max) el.setAttribute('max', item.max);
                if (item.minLength) el.setAttribute('minlength', item.minLength);
                if (item.maxLength) el.setAttribute('maxlength', item.maxLength);
                if (item.minItems) el.setAttribute('min-items', item.minItems);
                if (item.maxItems) el.setAttribute('max-items', item.maxItems);

                if (itemDesc !== '' && !itemDescHasHtml && itemDesc.length < this.placeholderMaxLength) {
                    el.setAttribute('placeholder', item.description);
                }

                // set placeholder text on underlying element input as well (if it exists)
                if (item.description && el.input) {
                    el.input.setAttribute('placeholder', item.description);
                }

                // set maxlength value on underlying element input as well (if it exists)
                if (item.maxLength && el.input) {
                    el.input.setAttribute('maxlength', item.maxLength);
                }

                // returns an object containing schema sub properties and their values
                const subProperties = this.getSubProperties(format) || {};
                // set sub property attributes
                Object.keys(subProperties).forEach(propKey => {
                    (el.setAttribute(propKey, subProperties[propKey]));
                });

            }

            return el;
        }

        /**
         * @description get sub properties of an object
         * @param {string} format - item format
         * @returns {object} dom object
         */
        getSubProperties(format) {

            const subPropertyStrings = format.split(':').slice(1); // name=value pairs
            // Turn them into a map.
            return subPropertyStrings.reduce((map, subPropertyString) => {
                const nameValueSplit = subPropertyString.split('=');
                // eslint-disable-next-line no-param-reassign
                map[nameValueSplit[0]] = nameValueSplit[1] || '';
                return map;
            }, {});
        }

    }

    // Register our new element
    document.registerElement('ca-form', CaForm);
});
