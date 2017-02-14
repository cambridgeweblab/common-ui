define(['./helpers/component-support.js', './helpers/create-element.js', './helpers/types.js', './helpers/add-event.js', './helpers/parent-by-attribute.js', 'document-register-element'], (componentSupport, createElement, types, addEvent, parentByAttribute) => {

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

            const self = this;
            this.isTouch = ('ontouchend' in document.documentElement);
            this.selections = {};

            switch (self.style) {

                case 'checkbox':
                    this.root = this;
                    break;

                default:
                    this.root = createElement(this, 'select', {});
                    this.root.multiple = this.multiple;
                    this.root.onchange = this.onChangeHandler.bind(self);

                    // force blur events to bubble (required for ca-form validation)
                    this.root.onblur = () => {

                        // helpers.fireEvent(self, 'blur');
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

                switch (name) {
                    case 'multiple': {

                        if (this.root instanceof HTMLSelectElement) {

                            this.root.multiple = (newValue === 'true');
                        }
                        // TODO: make checkboxes into radio buttons if not multiple
                    } break;
                }
            }
        }

        /**
         * Loads the json schema for this item
         * Executed when this.schema property changes
         * @returns {void} void
         */
        loadSchema() {

            const self = this;
            const schemaUrl = this.src;

            return componentSupport.request({ url: schemaUrl, dataType: 'json' }).then(data => {

                self.schema = data;
            })
            .catch(err => {

                self.data = {};
            });
        };

        /**
         * Renders the ca-select element
         * @returns {void} void
         */
        render() {

            if (!this.root) return;

            const self = this;
            let data = this.data || [];
            const hasData = (Array.isArray(data) && this.data.length);
            const defaultLabel = (hasData) ? ((this.type == 'tel') ? 'Code' : 'Please select') : 'No options available';

            if (this.readonly && this.style !== 'checkbox') {

                this.root.setAttribute('readonly', true);
            }

            // render options if we have some data to work with
            if (hasData) {

                if (this.style !== 'checkbox') {

                    // add default (unselectable) option
                    createElement(this.root, 'option', { value: '', 'data-index': 0, selected: true }, defaultLabel);
                }

                if (this.style == 'checkbox') {
                    
                    this.rootCheckbox = createElement(self.root, 'div', {});
                }

                for (let i = 0, l = this.data.length; i < l; i++) {

                    const item = this.data[i];

                    switch (this.style) {
                        
                        case 'checkbox': {

                            const p = createElement(this.rootCheckbox, 'p', {});
                            const opt = createElement(p, 'input', { type: 'checkbox', value: item.value, 'data-index': i+1 });
                            p.appendChild(document.createTextNode(' ' + item.label + ' '));

                            if (item.attachment) {

                                createElement(p, 'a', { href: item.attachment.href, target: '_blank' }, item.attachment.title);
                            }

                            opt.addEventListener('change', () => {

                                this.setAttribute('data-selected', (this.checked).toString());
                                onChangeHandler.call(self);
                            });
                        } break;

                        default: {
                            const opt = createElement(this.root, 'option', { value: item.value, 'data-index': i+1 }, item.label);

                            if (this.multiple) {

                                this.root.querySelectorAll('option')[0].disabled = true;
                            }

                            opt.selected = (item.value === this.value);
                                
                            if (!this.isTouch && this.multiple) {

                                opt.onmousedown = e => {

                                    helpers.cancelEvent(e || event);
                                    self.checkChange.call(self, this);
                                }

                                this.root.onclick = e => {

                                    helpers.cancelEvent(e || event);
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
        };

        /**
         * Executes each time an option is clicked
         * @returns {void} void
         */
        checkChange(el) {

            if (!el || el.value === '') return;

            const selected = (el.getAttribute('data-selected') === 'true');
            el.setAttribute("data-selected", !selected);
        };

        /**
         * A seemingly pointless method
         * @returns {void} void
         */
        onupdate(data) {

            helpers.trace(data);
        };

        /**
         * onChange handler
         * @returns {void} void
         */
        onChangeHandler() {

            const parentForm = parentByAttribute(this, 'tagName', 'CA-FORM');

            if (parentForm) {

                parentForm.setAttribute('data-select-' + this.id, this.value);
            }
        }

        get data() {

            return this._data || [];
        }

        set data(value) {

            this._data = value || [];
            this.render();
        }

        set schema(value) {

            let selectData = [];
            const data = schema.enum || schema.type;

            if (Array.isArray(data) && data.length) {

                for (let i = 0, l = data.length; i < l; i++) {

                    const value = data[i].enum && data[i].enum[0] || data[i];
                    const label = data[i].title || (l == 1 && schema.title) || data[i];
                    let links = data[i].links || (l == 1 && schema.links) || [];
                    links = links.filter(link => link.rel === 'preview');

                    selectData.push({
                        value: value,
                        label: label,
                        attachment: links.length && links[0] || null
                    });
                }
            }

            this.data = selectData;
        }

        get src() {

            return this.getAttribute('schema-url');
        }

        set src(value) {

            this.setAttribute('schema-url', value);
            this.loadSchema();
        }

        get value() {

            if (this.multiple) {

                let results = [];

                if (this.root) {

                    const options = (!isTouch) ? this.root.querySelectorAll('[data-selected="true"]') : Array.prototype.slice.call(this.root.options).where('selected', true);

                    helpers.forEach(options, item => {

                        results.push(item.value);
                    });
                }
                return results;
            }
            else {
                return this.root? (this.root.value || this._value) : '';
            }
        }

        set value(value) {

            this._value = value;

            if (this.root) {
                this.root.value = value;
            }
            
            // if this a multi-select element
            if (this.multiple) {

                // TODO: handle set with style = checkbox
                // grab hold of all the option elements
                const self = this;

                setTimeout(() => {

                    const options = self.root && self.root.querySelectorAll('option');

                    if (options) {

                        helpers.forEach(options, item => {

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

        get multiple() {

            return this.getAttribute('multiple') === 'true';
        }

        set multiple(value) {

            this.setAttribute('multiple', value.toString());
        }

        get selections() {

            return this._selections || {};
        }

        set selections(value) {

            this._selections = value;
        }

        get readonly() {

            return this.getAttribute('readonly') === 'true';
        }

        set readonly(value) {

            this.setAttribute('readonly', value);
        }

        get style() {

            return this.getAttribute('style');
        }

        set style(value) {

            this.setAttribute('style', value);
        }
    }

    document.registerElement('ca-select', Select);
});
