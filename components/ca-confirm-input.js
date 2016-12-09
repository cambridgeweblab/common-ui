define(['/components/helpers/create-element.js', 'document-register-element'], (createElement) => {
    /**
     * Confirm input custom web component.
     */
    class ConfirmInput extends HTMLElement {

        /**
         * Called when the component is created.
         * @returns {undefined} nada.
         */
        createdCallback() {
        }

        /**
         * Called when the component is attached to the DOM
         * @returns {undefined} nada.
         */
        attachedCallback() {
            // The element has been created so now create the structure
            const required = this.getAttribute('required') === 'required';
            const input1Options = {
                id: `caConfirmInput_${this.name}`,
                value: this.value,
                type: this.type,
                autofocus: '',
                class: 'ca-confirm-input-1'
            };
            const input2Options = {
                id: `caConfirmInput_${this.name}_confirm`,
                type: this.type,
                placeholder:
                `Please re-enter ${this.label.toLowerCase()}`,
                class: 'ca-confirm-input-2'
            };

            this.input1 = createElement(this, 'input', input1Options);

            if (this.autofocus) {
                this.input1.autofocus = true;
            }

            this.input2 = createElement(this, 'input', input2Options, this.label);

            // hook exit event
            this.input2.onblur = this.eventDelegate.bind(this);
            this.input2.onchange = this.eventDelegate.bind(this);

            this.input1.onpaste = () => false;
            this.input2.onpaste = () => false;

            this.input1.onkeyup = () => {
                const label = document.querySelector(`label[for="${this.getAttribute('name')}"]`);

                if (required) {
                    if (this.input1.value !== '') {
                        label.classList.add('hide-required');
                    } else {
                        label.classList.remove('hide-required');
                    }
                }
            };
        }

        /** @return {string} name, gets the name of the component */
        get name() {
            return this.getAttribute('name') || '';
        }

        /** @param {string} name, sets the name of the component */
        set name(name) {
            this.setAttribute('name', name || '');
        }

        /** @returns {string} ca-confirm-input.label - the label to use for the confirm text box */
        get label() {
            return this.getAttribute('label') || '';
        }

        /** @param {string} label - the label to use for the confirm text box */
        set label(label) {
            this.setAttribute('label', label || '');
        }

        /** @return {string} ca-confirm-input.type - the type of input control */
        get type() {
            return this.getAttribute('type') || '';
        }

        /** @param {string} type - the type of input control */
        set type(type) {
            this.setAttribute('type', type || '');
        }

        /** @return {string} ca-confirm-input.value - the value for this component */
        get value() {
            if (this.input1) {
                if (this.input1.value === '') {
                    return '';
                }
                return (this.isValid()) ? this.input1.value : 'INVALID';
            }
            // input1 control not yet created so get value from element property
            return this.getAttribute('value') || '';
        }

        /** @param {string} value - the value to set */
        set value(value) {
            if (this.input1) {
                this.input1.value = value || '';
            } else {
                // input1 control not yet created so set value into element property
                this.setAttribute('value', value || '');
            }
        }

        /** @returns {boolean} status of autofocus */
        get autofocus() {
            return this.getAttribute('autofocus') === 'true';
        }

        /** @param {string} value, sets autofocus */
        set autofocus(value) {
            this.setAttribute('autofocus', value);
        }

        /**
         * Event handler for ca-confirm-input.
         * @param {Event} e, event object.
         * @returns {undefined} void function.
         */
        eventDelegate(e = event) {
            const el = e.target || e.srcElement;
            const type = e.type.toLowerCase();
            const tag = el.tagName.toLowerCase();

            if (tag !== 'input') {
                return;
            }

            switch (type) {
                case 'blur': {
                    if (this.onblur) {
                        this.onblur.call(this, e);
                    }
                } break;

                case 'change': {
                    if (this.onchange) {
                        this.onchange.call(this, e);
                    }
                } break;

                default: break;
            }
        }

        /**
         * @description checks if the confirm input is valid by checking the values of input1 and input2
         * @returns {booleans} eval of the two values.
         */
        isValid() {
            return (this.input1.value === this.input2.value);
        }
    }

    document.registerElement('ca-confirm-input', ConfirmInput);
});
