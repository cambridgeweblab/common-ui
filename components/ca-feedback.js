define(['./helpers/component-support.js', './helpers/cancel-event.js', './helpers/create-element.js', './ca-dialog.js', './ca-form.js', 'document-register-element'],
(componentSupport, cancelEvent, createElement, dialog) => {
  /**
   * Class Feedback for a ca-feedback web component
   * @extends HTMLElement
   */
    class Feedback extends HTMLElement {

        /**
         * @exports ca-feedback
         * @description A custom HTML element (Web Component) that can be created using
         * document.createElement('ca-feedback') or included in a HTML page as an element.
         */

        /**
         * @description Executes when the element is first created
         * @access private
         * @type {Event}
         * @returns {void} nothing
         */
        createdCallback () {
            this.link = createElement(this, 'a', { href: '#' });
            this.tip = 'How could we improve?'; // default
            this.onclick = this.render;
        }

        // Create a prototype for our new element that extends HTMLElement
        /** @property {string} ca-feedback.schema - the contents of the JSON schema */
        get schema() {
            return this._schema;
        }
        /** @param {Object} value ca-feedback.schema - sets contents of the JSON schema */
        set schema(value) {
            this._schema = value;
        }

        /** @property {string} ca-feedback.src - the url containing the schema */
        get src() {
            return this.getAttribute('schema-url');
        }
        /** @param {string} value ca-feedback.src - the url containing the schema */
        set src(value) {
            this.setAttribute('schema-url', value);
            this.loadSchema();
        }

        /** @property {string} ca-feedback.tip - the text to show next to the feedback icon */
        get tip() {
            return this.getAttribute('data-tip');
        }
        /** @param {string} value ca-feedback.tip - the text to show next to the feedback icon */
        set tip(value) {
            this.setAttribute('data-tip', value);
        }

        /** @property {string} ca-feedback.description - the description to go in the body of the dialog */
        get description() {
            return this.getAttribute('data-description');
        }
        /** @param {string} value ca-feedback.description - sets the description to go in the body of the dialog */
        set description(value) {
            this.setAttribute('data-description', value);
        }

        /** @property {string} ca-feedback.dialog - holds the pointer to the dialog used for feedback */
        get dialog() {
            return this._dialog;
        }
        /** @param {string} value ca-feedback.dialog - holds the pointer to the dialog used for feedback */
        set dialog(value) {
            this._dialog = value;
        }

        /** @property {string} ca-feedback.dialogTitle - the title to display on the dialog used for feedback */
        get dialogTitle() {
            return this.getAttribute('dialog-title') || 'Feedback';
        }
        /** @param {string} value ca-feedback.dialogTitle - sets the title to display on the dialog used for feedback */
        set dialogTitle(value) {
            this.setAttribute('dialog-title', value || 'Feedback');
        }

        /**
         * @description Method to retrieve the load the JSON schema from the specified url
         * @returns {Object} JSON object of schema
         */
        loadSchema () {

            const schemaUrl = this.getAttribute('schema-url');

            return componentSupport.request({
                url: schemaUrl,
                dataType: 'json'
            }).then((data) => {
                this.schema = data;
            });

        }


        /**
         * @description Adds the ca-form to the dialog (but does not display it)
         * @param {Object} e, event object
         * @returns {void} nothing
         */
        render (e) {

            cancelEvent(e);

            // if the feedback dialog is already present, exit
            if (document.querySelector('ca-dialog')) return;

            this.dialog = createElement(document.body, 'ca-dialog');
            this.dialog.buttons = ['Send feedback'];


            if (this.description) {
                createElement(this.dialog.body, 'p', { class: 'dialog-intro' }, this.description);
            }

            const caForm = createElement(this.dialog.querySelector('.ca-dialog-content'), 'ca-form');
            caForm.columns = 1;
            caForm.className = 'feedback non-contextual';
            caForm.schema = [this.schema];

            // Submit the feedback form
            // Global event set within ca-dialog based on this.dialog.buttons = ['my-button-name']
            this.dialog.addEventListener('ca-dialog-click', () => {
                const form = caForm.querySelector('form');
                form.onsubmit();
            }, false);

            this.dialog.show();
        }

    }

    // Register our new element
    document.registerElement('ca-feedback', Feedback);
});
