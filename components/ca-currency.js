define(['./helpers/create-element.js', 'document-register-element'], (createElement) => {
  /**
   * Class Currency for a ca-currency web component
   * @extends HTMLElement
   */
    class Currency extends HTMLElement {
        /**
        * createdCallback - called when the component created, (not yet attached to the DOM).
        * @returns {undefined} initalises the component.
        */
        createdCallback() {
            this.input = createElement(this, 'input', { value: this.value, type: 'number', step: 'any' });

            if (this.readonly) {
                this.input.setAttribute('readonly', 'true');
            }
        }

        /** @return {string} symbol - the currency symbol (eg "£", "$") */
        get symbol() {
            return this.getAttribute('symbol');
        }

        /** @param {string} value - sets the currency symbol */
        set symbol(value) {
            this.setAttribute('symbol', value);
        }

        /** @returns {string} ca-currency.value - the currency value */
        get value() {
            return (this.input) ? this.input.value : this.getAttribute('value');
        }

        /** @param {string} value - sets the currency value */
        set value(value) {
            if (this.input) {
                this.input.value = value;
            } else {
                this.setAttribute('value', value);
            }
        }

        /** @returns {boolean} - ca-currency.readonly - whether the value is editable */
        get readonly() {
            return this.getAttribute('readonly') === 'true';
        }

        /** @param {string} value - flag to manage readonly */
        set readonly(value) {
            this.setAttribute('readonly', value);
        }
    }

    // Register our new element
    document.registerElement('ca-currency', Currency);
});
