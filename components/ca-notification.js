define(['./helpers/create-element.js', './helpers/types.js', 'document-register-element'], (createElement, types) => {
    /**
     * Class Notification for a Notification web component
     * @extends HTMLElement
     */
    class Notification extends HTMLElement {
        /**
        * Create a HTMLElement
        * @param {number} self - simply a hack for a polyfill to allow v1 web components.
        * @returns {undefined} initalises the component.
        */
        createdCallback() {
            const content = createElement(null, 'section', { class: 'ca-notification-content' });
            const closeButton = createElement(null, 'a', { class: 'ca-notification-close', href: '#' }, 'X');
            closeButton.addEventListener('click', this.close.bind(this), false);
            this.appendChild(closeButton);
            this.appendChild(content);
        }

        /**
        * observedAttributes - get a list of attributes that should effect re-render.
        * @return {array} list of attributes that effect a re-render.
        */
        static get observedAttributes() {
            return ['content'];
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
            if (Notification.observedAttributes.includes(name)) {
                this.render({ [name.toString()]: newValue });
            }
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
        * @return {string} type of the notification.
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
        * timeout getter
        * @return {string} timeout of the notification.
        */
        get timeout() {
            return this.getAttribute('timeout') || 3000;
        }

        /**
        * timeout setter
        * @param {string} value - value to set attribute
        */
        set timeout(value) {
            this.setAttribute('timeout', value);
        }

        /**
        * content getter
        * @return {string} type of the notification, defaults to info.
        */
        get content() {
            return this.getAttribute('content') || '';
        }

        /**
        * type setter
        * @param {string} value - value to set attribute
        */
        set content(value) {
            this.setAttribute('content', value);
        }

        /**
        * close - function to manage the hiding of the notification
        * @param {event} event - the event object, default to null
        * @return {void} undefined.
        */
        close(event = null) {
            // close function can be trigger without event, so check for event first.
            if (event) {
                event.preventDefault();
            }
            this.visibility = false;
        }

        /**
        * show - function to manage the showing of the notification
        * @return {void} undefined.
        */
        show() {
            if (this.content) {
                this.visibility = true;
            }
        }

        /**
        * render - renders the ca-dialog web component
        * @return {void} - undefined.
        */
        render({ content = null } = {}) {
            if (content) {
                const contentSection = this.querySelector('.ca-notification-content');
                contentSection.textContent = content;
            }
        }

    }

    document.registerElement('ca-notification', Notification);
});
