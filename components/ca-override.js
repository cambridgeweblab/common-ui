define([
    'helpers/get-element-value.js',
    'helpers/set-element-value.js',
    'helpers/create-element.js',
    'helpers/camel-to-title-case.js',
    './ca-property.js',
    'document-register-element'
], (getElementValue, setElementValue, createElement, camelToTitleCase) => {

    /**
     * A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-override') or included in a HTML page as an element. This element should be used
     * as a wrapper for an existing input element. When given a property schema to work from, it will show a default
     * value and an override checkbox (and not the input element). If you override the default, then the original
     * input element will be shown.
     */
    class Override extends HTMLElement {

        /**
         * Executes when the element is first created.
         * @return {undefined} nothing
         */
        createdCallback() {
            this.onclick = this.eventDelegate.bind(this);
        }

        /**
         * Executes when the element is attached to the DOM.
         * @return {undefined} nothing
         */
        attachedCallback() {
            this._checkbox = createElement(null, 'input', { type: 'checkbox', title: 'Override' });
            if (this.checked) {
                this._checkbox.checked = true;
            }
            this._caProperty = createElement(null, 'ca-property', {
                name: this.name,
                title: this.property.title || camelToTitleCase(this.name)
            });
            this._caProperty.property = this.property;
            this._caProperty.value = (this.property && this.property.defaultValue) || undefined;
            this.insertBefore(this._caProperty, this.firstChild);
            this.insertBefore(this._checkbox, this.firstChild);
        }

        /** @returns {Boolean} set if the override checkbox is checked. */
        get checked() {
            return this.getAttribute('checked') === 'checked';
        }

        /** @param {Boolean} value - set if the override checkbox is checked. */
        set checked(value) {
            this.setAttribute('checked', 'checked');
            if (this._checkbox) {
                this._checkbox.checked = true;
            }
        }

        /** @return {string} name of this property. */
        get name() {
            return this.getAttribute('name');
        }

        /** @param {string} value - name of this property. */
        set name(value) {
            this.setAttribute('name', value);
        }


        get property() {
            return this._property;
        }

        set property(value) {
            this._property = value;
            if (this._caProperty) {
                this._caProperty.property = value;
                this._caProperty.value = value.defaultValue;
            }
        }

        /** @return {any} property which delegates to its contained input element. */
        get value() {
            if (this.checked) {
                return getElementValue(this.lastChild);
            }
            return undefined;
        }

        /** @param {any} value - property which delegates to its contained input element. */
        set value(value) {
            setElementValue(this.lastChild, value);
            if (value !== null && value !== undefined) {
                this.checked = true;
            }
        }

        /**
         * Manages all internal events on an element
         * @access private
         * @param {object} e - the element that the event happened on
         * @return {boolean} true always
         */
        eventDelegate(e = event) {
            const el = e.target || e.srcElement;
            const eType = (e.type || '').toLowerCase();

            if (eType === 'click' && el === this._checkbox) {
                if (this._checkbox.checked) {
                    this.setAttribute('checked', 'checked');
                } else {
                    this.removeAttribute('checked');
                }
            }

            // Allow the event to bubble
            return true;
        }

    }

    // Register our new element
    document.registerElement('ca-override', Override);

});
