/* global cordova */
define(['./helpers/create-element.js', 'document-register-element'], (createElement) => {
    const txtProp = ('textContent' in document.createElement('i')) ? 'textContent' : 'innerText';

    /**
     * @exports ca-barcode-scanner
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-barcode-scanner') or included in a HTML page as an element
     */
    class BarcodeScanner extends HTMLElement {
        /**
         * createdCallback - called when the component created, (not yet attached to the DOM).
         * @returns {undefined} initalises the component.
         */
        createdCallback() {
            this.button = createElement(this, 'button', null, this.title);
            this.input = createElement(this, 'input', {
                type: 'hidden',
                step: 'any'
            });

            if (this.readonly) {
                this.input.setAttribute('readonly', 'true');
            }

            this.button.onclick = this.eventDelegate.bind(this);
        }

        /**
         * @description Executes when any attribute is changed on the element
         * @type {Event}
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {undefined}
         */
        attributeChangedCallback(attrName, oldVal, newVal) {
            switch (attrName) {
                case 'title': this.button[txtProp] = newVal; break;
                default: break;
            }
        }

        /** @property {string} ca-barcode-scanner.title - the title for the button */
        get title() {
            return this.getAttribute('title');
        }

        /**
         * @param  {string} title, sets the title.
         * @return {undefined} void, updates the attribute with title value.
         */
        set title(title) {
            this.setAttribute('title', title);
            this.button[txtProp] = title;
        }

        /** @property {string} ca-barcode-scanner.value - the value of the barcode scanned */
        get value() {
            return this.input.value;
        }

        /**
         * @param  {string} value, sets the value.
         * @return {undefined} void, updates the value of the component
         */
        set value(value) {
            this.input.value = value;
        }

        /** @property {string} ca-barcode-scanner.readonly - allows control to be disabled */
        get readonly() {
            return this.getAttribute('readonly') === 'true';
        }
        /**
         * @param  {string} value, sets the readonly attribute to value.
         * @return {undefined} void, updates the attribute with the value.
         */
        set readonly(value) {
            this.setAttribute('readonly', value);
        }

        /**
         * Event handler for component.
         * @param {event} e, event object from action.
         * @returns {undefined}
         */
        eventDelegate(e) {
            const el = e.target || e.srcElement;
            const type = e.type.toLowerCase();
            const tag = el.tagName.toLowerCase();

            if (tag !== 'button') return;

            switch (type) {
                case 'click':
                    cordova.plugins.barcodeScanner.scan(
                        result => {
                            if (result.cancelled !== 1) {
                                this.input.value = result.text;
                                el.innerText = 'Scan successful';
                            }
                        },
                        (error) => alert(`Scanning failed: ${error}`)
                    );
                    break;
                default:
                    break;

            }
        }
    }

    // Register our new element
    document.registerElement('ca-barcode-scanner', BarcodeScanner);
});
