define([
    './helpers/create-element.js',
    './helpers/fire-event.js',
    './ca-select.js',
    'document-register-element'
], (createElement, fireEvent) => {

    /**
     * Class Telephone for a telephone input web component
     * @extends HTMLElement
     */
    class Telephone extends HTMLElement {

        /**
         * executes when the element is first created
         * @returns {undefined}
         */
        createdCallback() {
            this.root = createElement(this, 'div', {});
            this.select = createElement(this.root, 'ca-select', { type: 'tel' });
            this.input = createElement(this.root, 'input', { type: 'tel' });

            this.select.onupdate = this.eventDelegate.bind(this);
            this.input.onblur = () => fireEvent(this, 'blur');
        }

        /**
         * Gets the list of international dialling codes.
         * @returns {Array} codes - from componentSupport.getTelephoneCodes()
         */
        get data() {
            return this._data || [];
        }

        /**
         * Sets the list of international dialling codes.
         * @param {Array} data - list of international dialing codes - from componentSupport.getTelephoneCodes()
         */
        set data(data) {
            this._data = data || [];
            this.render();
        }

        /**
         * Gets the currently selected international dialling code.
         * @returns {string} dialling code, or the empty string if nothing is selected
         */
        get idd() {
            let countryCode = this.select.value;
            if (countryCode) {
                countryCode = countryCode.replace('+', '');
            }
            return countryCode || '';
        }

        /**
         * Gets the currently entered national telephone number without international dialling code.
         * @returns {string} telephone number, or an empty string
         */
        get tel() {
            return this.input.value || '';
        }

        /**
         * Gets the full telephone number consisting of international dialling code, a space, and the national number.
         * If no international dialling code is entered, the return value will start with a space.
         * @returns {string} full telephone number or an empty string if no national number has been entered
         */
        get value() {
            const val = this.tel;

            // only return a value if the user has entered a number
            if (val !== '') {
                return `${this.idd} ${val}`;
            }

            return '';
        }

        /**
         * Sets the full telephone number consisting of international dialling code, a space and the national number.
         * Both parts must be present in the string.
         * @param {string} value - full telephone number
         */
        set value(value) {
            const res = value.split(' ');

            this.select.value = res[0];
            const cc = this.data.filter(item => item.value === res[0])[0];
            if (cc) {
                this.countryCode = cc.countryCode;
            }
            this.input.value = res[1];
        }

        /**
         * Gets the country code (ISO 3166 2-char) associated with the currently selected international dialling code.
         * This property is reflected onto the <code>data-country</code> attribute.
         * @returns {string} the ISO 3166 country code of the selected international dialling code.
         */
        get countryCode() {
            return this.root.getAttribute('data-country');
        }

        /**
         * Sets the international dialling code to the one for the specified ISO 3166 2-char country code.
         * By setting the country code, a flag is displayed alongside the international dialling code.
         * This property is reflected onto the <code>data-country</code> attribute.
         * @param {string} code - the ISO 3166 country code
         */
        set countryCode(code) {
            this.root.setAttribute('data-country', code.toUpperCase());
            this.root.className = `flag_${code.toLowerCase()}`;
            this.select.setAttribute('data-selected', (code !== ''));

            const dataItem = this.data.filter(item => item.countryCode === code)[0];

            if (dataItem) {
                this.select.value = dataItem.value;
            }
        }

        /**
         * Returns true if the dialling code has been selected manually.
         * @returns {boolean} true if the dialling code has been selected manually
         */
        get iddChanged() {
            return this._iddChanged;
        }

        /**
         * Sets whether the dialling code has been selected manually.
         * @param {boolean} value - true if the dialling code has been selected manually
         */
        set iddChanged(value) {
            // this changes whenever the user manually selects a non-blank telephone prefix
            this._iddChanged = value;
        }

        /**
         * Returns true if the user has not modified the idd and the telephone number is blank.
         * This flag is used to indicate that the country code can be synchronised by <code>ca-form</code> to a related
         * country input field.
         * @returns {boolean} true if the dialling code should be synchronised to a related country field by <code>ca-form</code>
         */
        get iddSynch() {
            // if the user has not modified the idd AND the telephone number is blank
            return (!this.iddChanged && (this.idd === '' || this.tel === ''));
        }

        /**
         * Render the Telephone input.
         * @returns {undefined}
         */
        render() {
            const data = this._data || [];
            this.select.data = data;
        }

        /**
         * Event handler for international dialling code selector.
         * @param {object} dataItem - selected item
         * @returns {undefined}
         */
        eventDelegate(dataItem) {
            // Set the country code to the newly selected value
            this.countryCode = dataItem.countryCode;

            // Set the idd changed flag if the country code is manually being set to a non blank value
            this.iddChanged = (dataItem.countryCode !== '');
        }
    }

    document.registerElement('ca-tel', Telephone);
});
