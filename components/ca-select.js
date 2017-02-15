define([
    './helpers/component-support.js',
    './helpers/create-element.js',
    './helpers/types.js',
    './helpers/add-event.js',
    './helpers/cancel-event.js',
    './helpers/parent-by-attribute.js',
    './helpers/trace.js',
    'document-register-element'
], (componentSupport, createElement, types, addEvent, cancelEvent, parentByAttribute, trace) => {

    /**
     * Select class for Select web component
     * @extends HTMLElement
     */
    class Select extends HTMLElement {

        /**
        * Called when element is initialised
        * @returns {void} void
        */
        createdCallback() {

            this.isTouch = ('ontouchend' in document.documentElement);
            this.selections = {};

            switch (this.style) {

                case 'checkbox':
                    this.root = this;
                    break;

                default:
                    this.root = createElement(this, 'select', {});
                    this.root.multiple = this.multiple;
                    this.root.onchange = () => this.onChangeHandler();

                    // force blur events to bubble (required for ca-form validation)
                    this.root.onblur = () => {

                        // helpers.fireEvent(this, 'blur');
                    };
            }

            if (this.data) this.render();
        }

        /**
        * observedAttributes - get a list of attributes that should effect re-render.
        * @return {array} list of attributes that effect a re-render.
        */
        static get observedAttributes() {
            return ['src'];
        }

        /**
         * @description Executes when any attribute is changed on the element
         * @type {Event}
         * @param {string} name - the name of the attribute to have changed
         * @param {string} oldValue - the old value of the attribute
         * @param {string} newValue - the new value of the attribute
         * @returns {void} void
         */
        attributeChangedCallback(name, oldValue, newValue) {

            // only need to re-render the component if the attribute value has changed
            if (oldValue !== newValue) {

                if (name === 'multiple') {

                    if (this.root instanceof HTMLSelectElement) {

                        this.root.multiple = (newValue === 'true');
                    }
                    // TODO: make checkboxes into radio buttons if not multiple
                }
            }
        }

        /**
         * Loads the json schema for this item
         * Executed when this.schema property changes
         * @returns {void} void
         */
        loadSchema() {

            const schemaUrl = this.src;

            return componentSupport.request({ url: schemaUrl, dataType: 'json' }).then(data => {

                this.schema = data;
            })
            .catch(() => {

                this.data = {};
            });
        }

        /**
         * Renders the ca-select element
         * @returns {void} void
         */
        render() {

            if (!this.root) return;

            const data = this.data || [];
            const hasData = (Array.isArray(data) && this.data.length);
            const defaultLabel = (hasData) ? ((this.type === 'tel') ? 'Code' : 'Please select') : 'No options available'; // eslint-disable-line

            if (this.readonly && this.style !== 'checkbox') {

                this.root.setAttribute('readonly', true);
            }

            // render options if we have some data to work with
            if (hasData) {

                if (this.style !== 'checkbox') {

                    // add default (unselectable) option
                    createElement(this.root, 'option', { value: '', 'data-index': 0, selected: true }, defaultLabel);
                }

                if (this.style === 'checkbox') {

                    this.rootCheckbox = createElement(this.root, 'div', {});
                }

                for (let i = 0, l = this.data.length; i < l; i++) {

                    const item = this.data[i];

                    switch (this.style) {

                        case 'checkbox': {

                            const p = createElement(this.rootCheckbox, 'p', {});
                            const opt = createElement(p, 'input', { type: 'checkbox', value: item.value, 'data-index': i + 1 });
                            p.appendChild(document.createTextNode(` ${item.label} `));

                            if (item.attachment) {

                                createElement(p, 'a', { href: item.attachment.href, target: '_blank' }, item.attachment.title);
                            }

                            opt.addEventListener('change', () => {

                                this.setAttribute('data-selected', (this.checked).toString());
                                this.onChangeHandler();
                            });
                        } break;

                        default: {
                            const opt = createElement(this.root, 'option', { value: item.value, 'data-index': i + 1 }, item.label);

                            if (this.multiple) {

                                this.root.querySelectorAll('option')[0].disabled = true;
                            }

                            opt.selected = (item.value === this.value);

                            if (!this.isTouch && this.multiple) {

                                opt.onmousedown = e => {

                                    cancelEvent(e || event);
                                    this.checkChange(this);
                                };

                                this.root.onclick = e => {

                                    cancelEvent(e || event);
                                };
                            }
                        }
                    }
                }

                // just in case this is a re-render, clear this!
                this.removeAttribute('data-empty');
            } else {

                // add an attribute to allow empty selects know this item has no children
                this.setAttribute('data-empty', 'true');
            }
        }

        /**
         * Executes each time an option is clicked
         * @param {object} el Element
         * @returns {void} void
         */
        checkChange(el) {

            if (!el || el.value === '') return;

            const selected = (el.getAttribute('data-selected') === 'true');
            el.setAttribute('data-selected', !selected);
        }

        /**
         * A seemingly pointless method
         * @param {object} data data
         * @returns {void} void
         */
        onupdate(data) {

            trace(data);
        }

        /**
         * onChange handler
         * @returns {void} void
         */
        onChangeHandler() {

            const parentForm = parentByAttribute(this, 'tagName', 'CA-FORM');

            if (parentForm) {

                parentForm.setAttribute(`data-select-${this.id}`, this.value);
            }
        }

        /**
         * Get data
         * @returns {array} data
         */
        get data() {

            return this._data || [];
        }

        /**
         * Sets data
         * @param {array} value Data
         * @returns {void} void
         */
        set data(value) {

            this._data = value || [];
            this.render();
        }

        /**
         * Sets schema
         * @param {object} schema schema
         * @returns {void} void
         */
        set schema(schema) {

            const selectData = [];
            const data = schema.enum || schema.type;

            if (Array.isArray(data) && data.length) {

                for (let i = 0, l = data.length; i < l; i++) {

                    const value = (data[i].enum && data[i].enum[0]) || data[i];
                    const label = data[i].title || (l === 1 && schema.title) || data[i];
                    let links = data[i].links || (l === 1 && schema.links) || [];
                    links = links.filter(link => link.rel === 'preview');

                    selectData.push({
                        value,
                        label,
                        attachment: (links.length && links[0]) || null
                    });
                }
            }

            this.data = selectData;
        }

        /**
         * Gets src
         * @returns {string} src
         */
        get src() {

            return this.getAttribute('schema-url');
        }

        /**
         * Sets src
         * @param {string} value src
         * @returns {void} void
         */
        set src(value) {

            this.setAttribute('schema-url', value);
            this.loadSchema();
        }

        /**
         * Gets value
         * @returns {string|array} value
         */
        get value() {

            if (this.multiple) {

                const results = [];

                if (this.root) {

                    const options = (!this.isTouch) ? this.root.querySelectorAll('[data-selected="true"]') : this.root.options.filter(option => option.value === 'selected')[0];

                    options.forEach(item => {

                        results.push(item.value);
                    });
                }
                return results;
            }

            return this.root ? (this.root.value || this._value) : '';
        }

        /**
         * Sets value
         * @param {string|array} value value
         * @returns {void} void
         */
        set value(value) {

            this._value = value;

            if (this.root) {
                this.root.value = value;
            }

            // if this a multi-select element
            if (this.multiple) {

                // TODO: handle set with style = checkbox
                // grab hold of all the option elements

                setTimeout(() => {

                    const options = this.root && this.root.querySelectorAll('option');

                    if (options) {

                        options.forEach(item => {

                            // if the value we are setting matches the option value
                            if (value.indexOf(item.value) > -1) {

                                // then set the data-selected attribute for this option
                                item.setAttribute('data-selected', true);
                            }
                        });
                    }
                }, 0);
            }
        }

        /**
         * Is this element a multiselect
         * @returns {boolean} true/false
         */
        get multiple() {

            return this.getAttribute('multiple') === 'true';
        }

        /**
         * Sets multiselect
         * @param {string} value Is multiselect
         * @returns {void} void
         */
        set multiple(value) {

            this.setAttribute('multiple', value.toString());
        }

        /**
         * Gets selections
         * @returns {array} selections
         */
        get selections() {

            return this._selections || {};
        }

        /**
         * Sets selections
         * @param {array} value selections
         * @returns {void} void
         */
        set selections(value) {

            this._selections = value;
        }

        /**
         * Get readonly
         * @returns {boolean} readonly
         */
        get readonly() {

            return this.getAttribute('readonly') === 'true';
        }

        /**
         * Sets readonly
         * @param {boolean} value readonly
         * @returns {void} void
         */
        set readonly(value) {

            this.setAttribute('readonly', value);
        }

        /**
         * Gets style
         * @returns {string} style
         */
        get style() {

            return this.getAttribute('style');
        }

        /**
         * Sets style
         * @param {string} value style
         * @returns {void} void
         */
        set style(value) {

            this.setAttribute('style', value);
        }
    }

    document.registerElement('ca-select', Select);
});
