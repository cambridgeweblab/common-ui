define([
    './helpers/create-element.js',
    './helpers/clear-element.js',
    './helpers/cancel-event.js',
    './helpers/keyboard.js',
    'document-register-element'
], (createElement, clearElement, cancelEvent, keyboard) => {

    /**
     * @exports ca-input-array component
     * @extends HTMLElement
     */
    class CaInputArray extends HTMLElement {

        /**
         * Executes when the element is first created
         * @access private
         * @returns {void}
         */
        createdCallback() {

            this.render();
        }

        /**
         * Executes when any attribute is changed on the element
         * @access private
         * @type {Event}
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {void}
         */
        attributeChangedCallback(attrName, oldVal, newVal) {

            // if we do not have a property matching the attribute, exit
            if (!this[attrName]) return;

            // it the value has changed, update and re-render to reflect changes
            if (oldVal !== newVal) {
                this[attrName] = newVal;
                this.render();
            }
        }

        /**
         * @returns {string} type
         */
        get type() {
            return this.getAttribute('type') || 'text';
        }

        /**
         * @param {string} value type
         * @returns {void}
         */
        set type(value) {
            this.setAttribute('type', value);
        }

        /**
         * @returns {string} id
         */
        get id() {
            return this.getAttribute('id') || '';
        }

        /**
         * @param {string} value id
         * @returns {void}
         */
        set id(value) {
            this.setAttribute('id', value);
        }

        /**
         * @returns {array|string} value
         */
        get value() {

            const self = this;
            const elements = Array.prototype.slice(this.querySelectorAll(this.childSelector));
            let values = [];
            let invalid = false;

            // grab value for each item
            values = elements.map(item => item.value || '');

            // remove empty items
            values = values.filter(Boolean);

            if (this.type === 'number') {

                // convert values to numbers
                values = values.map(value => parseInt(value || '0', 10));

                // preform .min .max .divisibleBy validation (if configured)
                values = values.filter(num => {

                    const isValid = this.isValidNumber(self, num);

                    if (!isValid) {
                        invalid = true;
                    }

                    return isValid;
                });

                // wipe out values if we have any invalid items
                values = (invalid) ? [] : values;
            }

            // only return an array of values if the values are not
            // empty (allows ca-form required to just work!)
            return values.length > 0 ? values : '';
        }

        /**
         * Returns a sum of the numeric values
         * @returns {integer} sum
         */
        get sum() {

            let sum = 0;
            const values = (this.value || []);

            if (this.type === 'number') {

                sum = values.reduce((a, b) => a + b, 0);
            }

            return sum;
        }

        /**
         * regex pattern to mask the input
         * @returns {string} pattern
         */
        get pattern() {

            return this.getAttribute('pattern') || '';
        }

        /**
         * regex pattern to mask the input
         * @param {string} value pattern
         * @returns {void}
         */
        set pattern(value) {

            this.setAttribute('pattern', value);
        }

        /**
         * @returns {integer} min
         */
        get min() {

            return parseInt(this.getAttribute('min') || '-1', 10);
        }

        /**
         * @param {integer} value value
         * @returns {void}
         */
        set min(value) {

            this.setAttribute('min', parseInt(value || '-1', 10));
        }

        /**
         * @returns {integer} max
         */
        get max() {

            return parseInt(this.getAttribute('max') || '-1', 10);
        }

        /**
         * @param {integer} value value
         * @returns {void}
         */
        set max(value) {

            this.setAttribute('max', parseInt(value || '-1', 10));
        }

        /**
         * value the number must be divisible by with no remainder
         * @returns {integer} divisibleBy
         */
        get divisibleBy() {

            return parseInt(this.getAttribute('divisible-by') || '1', 10);
        }

        /**
         * value the number must be divisible by with no remainder
         * @param {integer} value value
         * @returns {void}
         */
        set divisibleBy(value) {

            this.setAttribute('divisible-by', parseInt(value || '1', 10));
        }

        /**
         * @returns {integer} maxLength
         */
        get maxLength() {

            return parseInt(this.getAttribute('maxlength') || '-1', 10);
        }

        /**
         * @param {integer} value value
         * @returns {void}
         */
        set maxLength(value) {

            this.setAttribute('maxlength', parseInt(value || '-1', 10));
        }

        /**
         * @returns {integer} minItems
         */
        get minItems() {

            return parseInt(this.getAttribute('min-items') || '1', 10);
        }

        /**
         * @param {integer} value value
         * @returns {void}
         */
        set minItems(value) {

            this.setAttribute('min-items', value);
        }

        /**
         * @returns {integer} maxItems
         */
        get maxItems() {

            return parseInt(this.getAttribute('max-items') || '-1', 10);
        }

        /**
         * @param {integer} value value
         * @returns {void}
         */
        set maxItems(value) {

            this.setAttribute('max-items', value);
        }

        /**
         * @returns {string} child selector string
         */
        get childSelector() {

            // HACK, https://stackoverflow.com/questions/18677323/html5-input-type-number-value-is-empty-in-webkit-if-has-spaces-or-non-numeric-ch
            // Number doesn't return -+ as characters when you domElement.value
            // var type = this.type === 'number' ? 'text' : this.type;
            const type = this.type;
            return `input[type="${type}"]`;
        }

        /**
         * @returns {integer} count
         */
        get count() {

            return this.querySelectorAll(this.childSelector).length;
        }

        /**
         * @returns {boolean} autofocus
         */
        get autofocus() {

            return this.getAttribute('autofocus') === 'true';
        }

        /**
         * @param {boolean} value value
         * @returns {void}
         */
        set autofocus(value) {

            this.setAttribute('autofocus', value === 'true');
        }

        /**
         * @param {integer} newIndex - integer index of position to insert new item
         * @returns {void}
         */
        addItem(newIndex) {

            const index = newIndex || -1;
            let lineItem = null;
            let removeButton = null;
            let input = null;
            let addButton = null;
            let marker = null;

            // HACK, https://stackoverflow.com/questions/18677323/html5-input-type-number-value-is-empty-in-webkit-if-has-spaces-or-non-numeric-ch
            // Number doesn't return -+ as characters when you domElement.value
            // var type = this.type === 'number' ? 'text' : this.type;
            const type = this.type;

            // do not add another item if doing so takes us over max items
            if (this.maxItems > 0 && this.count + 1 > this.maxItems) return;

            // create item container
            lineItem = createElement(null, 'div', {
                'data-index': this.count
            });

            // add remove button
            removeButton = createElement(lineItem, 'button', {
                class: 'ca-input-array-remove',
                title: 'Remove item',
                tabindex: '-1'
            }, 'x');

            // remove item on click
            removeButton.onclick = this.removeClick.bind(this);

            // add input
            input = createElement(lineItem, 'input', { type, pattern: this.pattern });

            // on accurate way to get values on key hits - http://unixpapa.com/js/key.html
            input.onkeypress = this.keypressHandler.bind(this);
            input.onkeyup = this.keyupHandler.bind(this);

            // if type is number add min/max attributes if they exist
            if (this.type === 'number') {
                if (this.min > -1) input.setAttribute('min', this.min);
                if (this.max > -1) input.setAttribute('max', this.max);
                input.setAttribute('divisible-by', this.divisibleBy);
            }

            // add max length if it is set
            if (this.maxLength > -1) {

                input.setAttribute('maxlength', this.maxLength);
            }

            // add remove button
            addButton = createElement(lineItem, 'button', {
                class: 'ca-input-array-add',
                title: 'Add item',
                tabindex: '-1'
            }, '+');

            // add new item on click
            addButton.onclick = this.addClick.bind(this);

            // if we have an element at this index, insert before
            marker = this.querySelector(`div[data-index="${index}"]`);

            if (marker) {

                // insert before to allow this item to take x position
                this.insertBefore(lineItem, marker);
            } else {

                // no marker, just append to end of list
                this.appendChild(lineItem);
            }

            // update data-index's
            this.reIndex(this);

            // avoid setting focus unless the parent control has focus
            if (this.count > 1) {

                input.focus();
            }
        }

        /**
         * @param {integer} index - index of item as zero based integer
         * @returns {void}
         */
        removeItem(index) {

            let el = null;

            // dont allow removal if it would reduce the number of items to below min items
            if (this.count - 1 < this.minItems) return;

            el = this.querySelector(`div[data-index="${index}"]`);

            if (el) {

                el.parentElement.removeChild(el);
                this.reIndex(this);
                this.setFocus(Math.min(index, this.count - 1));
            }
        }

        /**
         * @param {integer} index - index of item as zero based integer
         * @returns {void}
         */
        setFocus(index) {

            const el = this.querySelector(`div[data-index="${Math.max(index, 0)}"] input`);

            if (el) {
                el.focus();
                this.setAttribute('data-sum', this.sum);
            }
        }

        /**
         * @returns {void}
         */
        render() {

            // in case this has been called before, wipe out all children
            clearElement(this);

            // insert items - at least one!
            for (let i = 0, l = this.minItems; i < l; i++) {
                this.addItem();
            }

            if (this.autofocus) this.setFocus(0);
        }

        /**
         * @param {event} e event
         * @returns {void}
         */
        removeClick(e) {

            const ev = e || event;
            const el = ev.target || ev.srcElement;
            const index = parseInt(el.parentElement.getAttribute('data-index') || '0', 10);

            this.removeItem(index);

            cancelEvent(ev);
        }

        /**
         * @param {event} e event
         * @returns {void}
         */
        addClick(e) {

            const ev = e || event;
            const el = ev.target || ev.srcElement;
            const index = parseInt(el.parentElement.getAttribute('data-index') || '0', 10);

            this.addItem(index + 1);

            cancelEvent(ev);
        }

        /**
         * handles input on key press events - http://unixpapa.com/js/key.html
         * @param {event} e event
         * @returns {void}
         */
        keypressHandler(e) {

            const ev = e || event;
            const el = ev.target || ev.srcElement;
            const key = ev.charCode || ev.keyCode || ev.which || '';
            const char = String.fromCharCode(key);
            const index = parseInt(el.parentElement.getAttribute('data-index') || '0', 10);

            // respond to key events
            switch (key) {

                // AS per https://github.com/eslint/eslint/issues/8047 - eslint upgraded needed
                // eslint-disable-next-line no-lone-blocks
                case 13: { // handle ENTER key press

                    cancelEvent(ev);

                    // if we have no max items OR the current count < maxItem && index == this.count (at the bottom)
                    if ((this.maxItems === -1 || this.count < this.maxItems) && index === this.count - 1) {
                        this.addItem(-1);
                    } else {
                        // move to next item, or remain at the bottom
                        this.setFocus((this.count > index) ? index + 1 : index);
                    }

                } break;

                // AS per https://github.com/eslint/eslint/issues/8047 - eslint upgraded needed
                // eslint-disable-next-line no-lone-blocks
                case 8: { // handle BACKSPACE key press

                    if (el.value === '') {

                        if (this.count > this.minItems) {

                            cancelEvent(ev);
                            this.removeItem(index);
                        } else {

                            // move to previous item
                            this.setFocus((index > 0) ? index - 1 : index);
                        }
                    }
                } break;

                default: {
                    if (this.type === 'number' && !keyboard.navKeys(key) && !this.isNumberChar(char)) {
                        cancelEvent(ev);
                    }
                }
            }
        }

        /**
         * @description checks if the value passed is a valid number based on config
         * @param {integer|float|string} num - value to inspect
         * @returns {bool} true if valid otherwise false
         */
        isValidNumber(num) {

            if (this.min > -1 && num < this.min) {
                return false;
            } else if (this.max > -1 && num > this.max) {
                return false;
            } else if (num % this.divisibleBy !== 0) {
                return false;
            }

            return true;
        }

        /**
         * intercepts on key up event on input and updates sum attribute
         * @param {event} e event
         * @returns {void}
         */
        keyupHandler(e) {
            const ev = e || event;
            const el = ev.target || ev.srcElement;
            let value = null;
            let valid = true;

            if (this.type === 'number' && el.value !== '') {
                value = parseInt(el.value || '0', 10);
                valid = this.isValidNumber(this, value);
            }

            if (!valid) {
                el.parentElement.setAttribute('data-invalid', 'true');
            } else {
                el.parentElement.removeAttribute('data-invalid');
            }

            if (this.type === 'number') {
                // update sum
                this.setAttribute('data-sum', this.sum);
            }
        }

        /**
         * go through all div line items and correctly order the data-index
         * @returns {void}
         */
        reIndex() {

            Array.prototype.slice.call(this.querySelectorAll('div[data-index]')).forEach((item, index) => {
                item.setAttribute('data-index', index);
            });
        }

        /**
         * quick regex and . count to check if value could be considered a float
         * @param {integer} value value
         * @returns {boolean} is number char
         */
        isNumberChar(value) {

            return (/^[0-9]+?$/).test(value);
        }
    }

    // Register new element
    document.registerElement('ca-input-array', CaInputArray);
});
