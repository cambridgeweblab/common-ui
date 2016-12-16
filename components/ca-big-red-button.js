define([
    '/components/helpers/create-element.js',
    '/components/helpers/types.js',
    '/components/helpers/secureajax.js',
    '/components/helpers/dialogs.js',
    'document-register-element'
], (createElement, types, ajax, dialogs) => {
    /**
     * @exports ca-big-red-button
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-big-red-button') or included in a HTML page as an element.
     */
    class BigRedButton extends HTMLElement {
        /**
         * @description Executes when the element is first created
         * @returns {undefined} scaffolds component.
         */
        createdCallback() {
            createElement(this, 'h2', null, 'WARNING!');
            createElement(this, 'p', null, 'Resetting application data will clear all data entered and reset the application back to its default test data.');

            const button = createElement(this, 'button', null, 'Reset application data');
            const close = createElement(this, 'span', null, 'X');

            close.onclick = () => {
                this.close();
            };

            button.onclick = () => {
                this.show();
            };
        }

        /** @returns {string} action attribute, the url to request */
        get action() {
            return this.getAttribute('action');
        }

        /**
         * @param  {string} value, sets the url to request.
         * @return {undefined} void, updates the attribute with value.
         */
        set action(value) {
            this.setAttribute('action', value);
        }

        /** @returns {string} method attribute - the request type */
        get method() {
            return this.getAttribute('method');
        }

        /**
         * @param  {string} value, sets the url to request.
         * @return {undefined} void, updates the method attribute with value.
         */
        set method(value) {
            this.setAttribute('method', value);
        }

        /**
         * @description show a confirmation dialog before performing request.
         * @returns {undefined} - void, makes an ajax request to perform action.
         */
        show() {
            dialogs.confirm('Are you sure you want to reset the application back to default test data?', 'Confirm', (callback) => {
                if (callback === 'Yes') {
                    ajax.execute({
                        url: this.action,
                        type: this.method,
                        dataType: 'json'
                    })
                    .then(() => {
                        dialogs.alert('All data entered has been cleared and the application has been reset back to default test data.', 'Success', null, () => {
                            this.close();
                        }, 'dialog-reset-data');
                    }, () => this.close());
                } else {
                    this.close();
                }
            }, 'dialog-reset-data');
        }

        /**
         * @description Method to close the dialog and reload the page
         * @return {undefined} void, clears state and reloads location.
         */
        close() {
            history.replaceState('', document.title, window.location.pathname);
            location.reload();
        }
    }

    // Register our new element
    document.registerElement('ca-big-red-button', BigRedButton);
});
