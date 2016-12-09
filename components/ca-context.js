define(['document-register-element'], () => {
    /**
     * Web component context
     */
    class Context extends HTMLElement {

        /** @returns {string} attribute id */
        get id() {
            return this.getAttribute('id');
        }

        /** @param {string} value, assigned to id attrinute */
        set id(value) {
            this.setAttribute('id', value);
        }

        /** @returns {string} attribute name */
        get name() {
            return this.getAttribute('name');
        }

        /** @param {string} value, assigned to name attrinute */
        set name(value) {
            this.setAttribute('name', value);
        }

        /** @returns {string} user path */
        get value() {
            return this.getUserPath();
        }

        /** @returns {string} type */
        get type() {
            return 'hidden';
        }

        /**
         * Attempts to construct a path based on the users UI
         * We use query selector over $ so we only get the first instance of any object
         * @returns {string} path based values
         */
        getUserPath() {
            const txtProp = ('textContent' in document.createElement('i')) ? 'textContent' : 'innerText';
            const result = [];

            const nav = document.querySelector('ca-nav:not(.non-contextual) a[data-selected]');
            if (nav) {
                result.push(`Menu[${nav[txtProp]}]`);
            }

            const list = document.querySelector('ca-list:not(.non-contextual)');
            if (list) {
                result.push(`List[${list.className}]`);
            }

            const dialog = document.querySelector('div.dialog:not(.non-contextual) .dialog-title');
            if (dialog) {
                result.push(`Dialog[${dialog[txtProp]}]`);
            }

            const form = document.querySelector('ca-form:not(.non-contextual)');
            if (form) {
                result.push(`Form[${form.className}]`);
            }

            return result.join(' > ');
        }
    }

    document.registerElement('ca-context', Context);
});
