define([
    './helpers/create-element.js',
    './helpers/clear-element.js',
    './helpers/cancel-event.js',
    './helpers/fire-event.js',
    './helpers/dialogs.js',
    './ca-form.js',
    './ca-select.js',
    './ca-summary.js',
    './ca-property.js',
    'document-register-element'
], (createElement, clearElement, cancelEvent, fireEvent, dialogs) => {

    /**
     * @exports ca-object-list
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-object-list') or included in a HTML page as an element.
     * This component is a way of displaying a list of complex objects with the ability to add and remove from the list.
     * The component reuses ca-summary to display existing objects, and ca-form to add new objects.
     */
    class ObjectList extends HTMLElement {
        /**
         * Gets title to be used for these items
         * @returns {string} title, title to get.
         */
        get title() {
            return this.getAttribute('title');
        }

        /**
         * Sets title to be used for these items
         * @param {string} title, title to set.
         */
        set title(title) {
            this.setAttribute('title', title);
        }

        /**
         * Gets the JSON schema for each item in the object list
         * @returns {object} schema
         */
        get schema () {
            return this._schema;
        }

        /**
         * Sets the JSON schema for each item in the object list
         * @param {object} schema that drives render.
         */
        set schema(schema) {
            this._schema = schema;
            if (this.parentNode) { // already attached
                this.render();
            }
        }

        /**
         * Gets the object array being managed by this component
         * @returns {Array} value
         */
        get value() {
            return Array.from(this.querySelectorAll('ca-summary')).map(record => record.data);
        }

        /**
         * Sets the object array being managed by this component
         * @param {Array} value, array for data.
         */
        set value(value) {
            this._property = value;
            if (this.parentNode && this._schema) {
                this.render();
            }
        }

        /**
         * @description Executes when the element is attached to the DOM
         * @returns {undefined} calls render if condition is met
         */
        attachedCallback() {
            // Render the component now it has been added to the DOM, if we have a schema.
            if (this.schema) {
                this.render();
            }
        }

        /**
         * @description Show the form to add a new object
         * @returns {undefined} nothing, shows form.
         */
        showForm () {
            const dialogId = `${this.id}-addDialog`;

            if (!dialogs.get(dialogId)) {
                const dlg = dialogs.open('', {
                    id:	dialogId,
                    autoshow:	false,
                    title:	`Add ${this.title}`,
                    css: `animated fadeInDown ${this.id}` || '',
                    bodycss: 'no-scroll',
                    buttons: ['Cancel', 'Add'],
                    callback: (btnName) => {
                        if (btnName === 'Add') {
                            // This makes me cry, but refactoring is the only solution to this.
                            // eslint-disable-next-line no-use-before-define
                            if (form.isValid()) {
                                const createForm = document.querySelector(`#${this.id}-addDialog form`);
                                if (createForm) {
                                    fireEvent(createForm, 'submit');
                                }
                                return true;
                            }
                            // dont allow the dialog to close
                            return false;
                        }
                        return true;
                    }
                });
                // This makes me cry, but refactoring is the only solution to this.
                // eslint-disable-next-line no-undef
                const form = createElement(dlg.body, 'ca-form');

                // dont show the dialog until all data fetched and contents rendered
                form.onrendercomplete = () => {
                    // This makes me cry, but refactoring is the only solution to this.
                    // eslint-disable-next-line no-undef
                    dlg.show();
                };

                form.columns = 1;
                form.className = this.id;

                form.onsave = () => {
                    this.addCard(form.getData());
                };
                form.schema = [this.schema];
                this._isFormShowing = true;
            }
        }

        /**
         * @description Renders the element (invoked via render.call(this))
         * @returns {undefined} renders to the dom.
         */
        render() {
            clearElement(this);
            this._button = createElement(this, 'button', { class: 'ca-object-list-add' }, 'Add');
            this._button.onclick = this.addButtonHandler.bind(this);
            if (this._property && Array.isArray(this._property)) {
                for (let i = 0, l = this._property.length; i < l; i++) {
                    this.addCard(this._property[i]);
                }
            }
        }

        /**
         * @description Adds a card with a single record to the rendered view.
         * @param {object} data the data for the record
         * @returns {undefined} nothing
         */
        addCard(data) {
            const card = createElement(null, 'ca-summary', { type: 'card', itemsPerCol: 100 });
            card.schema = this.schema;
            card.data = data;
            this.insertBefore(card, this._button);
        }

        /**
         * @description button handler.
         * @param {event} e, event.
         * @returns {undefined} nothing. Shows form.
         */
        addButtonHandler(e) {
            cancelEvent(e);
            this.showForm();
        }
    }

    // Register our new element
    document.registerElement('ca-object-list', ObjectList);
});
