define(['/components/helpers/create-element.js', '/components/helpers/types.js', 'document-register-element'], (createElement, types) => {
    // desctruture until customElements is a standard.
    const { customElements } = window;
    /**
    * buildActions
    * @param {element} element to append the actions to.
    * @param {array} actions - a collection of actions that need to map to buttons.
    * @return {HTMLElement} html content built via parsing actions.
    */
    function buildActions(element, actions = []) {
        actions.forEach((action) => {
            createElement(element, 'button', { name: action.trim() }, action.trim());
        });
    }
    /**
     * Class Dialog for a dialog web component
     * @extends HTMLElement
     */
    class Dialog extends HTMLElement {
        /**
        * Create a HTMLElement
        * @param {number} self - simply a hack for a polyfill to allow v1 web components.
        */
        constructor(self) {
            const dialog = super(self);

            // create dialog-content and structure
            const dialogContent = createElement(null, 'article', { class: 'ca-dialog-body' });
            createElement(dialogContent, 'h1', {}, '');
            createElement(dialogContent, 'section', { class: 'ca-dialog-content' }, '');

            // create container for buttons and dynamic buttons
            const buttonContainer = createElement(dialogContent, 'section', { class: 'ca-dialog-buttons-container' });
            const dynamicButtonContainer = createElement(buttonContainer, 'section', { class: 'ca-dialog-dynamic-buttons' });

            // close button should always be there, not optional.
            const closeButton = createElement(buttonContainer, 'button', { name: 'close' }, 'Close');
            dialogContent.appendChild(buttonContainer);

            // attach the overlay and dialog content
            createElement(dialog, 'div', { class: 'ca-dialog-overlay' });
            dialog.appendChild(dialogContent);

            closeButton.addEventListener('click', this.close.bind(this), false);
            // watch for click events on the dynamic container
            dynamicButtonContainer.addEventListener('click', (event) => {
                const name = event.target.name;
                const clickEvent = new CustomEvent('ca-dialog-click', {
                    detail: {
                        button: name,
                        target: event.target
                    },
                    bubbles: true
                });
                this.dispatchEvent(clickEvent);
            });
            return dialog;
        }

        /**
        * observedAttributes - get a list of attributes that should effect re-render.
        * @return {array} list of attributes that effect a re-render.
        */
        static get observedAttributes() {
            return ['heading', 'content', 'buttons'];
        }

        /**
        * attributeChangedCallback - get a list of attributes that should effect re-render.
        * @param {string} name - attribute name.
        * @param {string} oldValue - old value of the attribute.
        * @param {string} newValue - new value of the attribute.
        * @return {void} undefined.
        */
        attributeChangedCallback(name, oldValue, newValue) {
            // no need to check old / new value - see render method.
            this.render({ [name.toString()]: newValue });
        }

        /**
        * visibility getter
        * @return {string} visibility of the element, defaults to false
        */
        get visibility() {
            return types.toBoolean(this.getAttribute('visibility'));
        }

        /**
        * visibility setter
        * @param {string} value - value to set attribute
        */
        set visibility(value) {
            this.setAttribute('visibility', value);
        }

        /**
        * type getter
        * @return {string} type of the modal.
        */
        get type() {
            return this.getAttribute('type');
        }

        /**
        * type setter
        * @param {string} value - value to set attribute
        */
        set type(value) {
            this.setAttribute('type', value);
        }

        /**
        * buttons getter
        * @return {string} visibility of the element, defaults to true
        */
        get buttons() {
            return (this.getAttribute('buttons') || '').split(',');
        }

        /**
        * buttons setter
        * @param {string} value - value to set attribute
        */
        set buttons(value) {
            this.setAttribute('buttons', value);
        }

        /**
        * content getter
        * @return {HTMLElement} body content of the modal.
        */
        get content() {
            return this._content;
        }

        /**
        * content setter - set the modal body content.
        * @param {HTMLElement} element - body content of the modal.
        */
        set content(element) {
            this._content = element;
            // At least reflect onto the attributes that we set content.
            this.setAttribute('content', 'true');
        }

        /**
        * heading getter - get the modal heading.
        * @return {string} visibility of the element, defaults to true
        */
        get heading() {
            return this.getAttribute('heading');
        }

        /**
        * heading setter - set the modal heading
        * @param {string} value - value to set attribute
        */
        set heading(value) {
            this.setAttribute('heading', value);
        }

        /**
        * close - function to manage the hiding of the modal
        * @return {void} undefined.
        */
        close() {
            this.visibility = false;
        }

        /**
        * show - function to manage the showing of the modal
        * @return {void} undefined.
        */
        show() {
            this.visibility = true;
        }

        /**
        * render - renders the ca-dialog web component
        * @return {void} - undefined.
        */
        render({ heading = null, content = null, buttons = null } = {}) {
            if (heading) {
                this.querySelector('h1').textContent = heading;
            }

            if (content) {
                const contentSection = this.querySelector('.ca-dialog-content');
                contentSection.innerHTML = '';
                contentSection.appendChild(this.content);
            }

            if (buttons) {
                const existingDynamicActions = this.querySelector('.ca-dialog-dynamic-buttons');
                existingDynamicActions.innerHTML = '';
                buildActions(existingDynamicActions, this.buttons);
            }
        }
    }
    customElements.define('ca-dialog', Dialog);
});
