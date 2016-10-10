define(['/components/helpers/create-element.js', '/components/helpers/types.js', '/components/ca-notification.js', 'document-register-element'], (createElement, types) => {
    // desctruture until customElements is a standard.
    const { customElements } = window;

    /**
     * Class NotificationContainer for a NotificationContainer web component
     * @extends HTMLElement
     */
    class NotificationContainer extends HTMLElement {
        /**
        * Create a HTMLElement
        * @param {number} self - simply a hack for a polyfill to allow v1 web components.
        */
        constructor(self) {
            const notificationContainer = super(self);
            notificationContainer._closeStack = [];
            return notificationContainer;
        }

        /**
        * observedAttributes - get a list of attributes that should effect re-render.
        * @return {array} list of attributes that effect a re-render.
        */
        static get observedAttributes() {
            return ['notifications'];
        }

        /**
        * detachedCallback - called when the element is detached from the dom.
        * @return {void} nothing is returned, just clears the close stack.
        */
        detachedCallback() {
            this.closeStack.forEach((stack) => {
                clearTimeout(stack);
            });
        }

        /**
        * visibility - get.
        * @return {string} value of visibility attribute
        */
        get visibility() {
            return types.toBoolean(this.getAttribute('visibility'));
        }

        /**
        * visibility - set.
        * @param {string} value to map to visibility
        */
        set visibility(value) {
            this.setAttribute('visibility', value);
        }

        /**
        * closeStack - get a list of defered close functions.
        * @return {array} list of defered close functions.
        */
        get closeStack() {
            return this._closeStack;
        }

        /**
        * timeout - get timeout that overrides notification timeouts
        * @return {string} list of defered close functions.
        */
        get timeout() {
            return this.getAttribute('timeout');
        }

        /**
        * closeStack - get a list of defered close functions.
        * @param {string} value - timeout override
        * @return {array} list of defered close functions.
        */
        set timeout(value) {
            this.getAttribute('timeout', value);
        }

        /**
        * addNotification - function to manage the hiding of the notification
        * @param {ca-notification} notification to append to container.
        * @return {void}.
        */
        addNotification(notification) {
            this.appendChild(notification);
            this.visibility = true;
            notification.show();
            const timeout = setTimeout(() => {
                notification.close();
                this.removeChild(notification);
                if (this.children.length === 0) {
                    this.visibility = false;
                }
            }, window.parseInt(this.timeout || notification.timeout));
            // having a setting for an array to push feels odd
            // so use the getter and push :)
            this.closeStack.push(timeout);
        }
    }

    customElements.define('ca-notification-container', NotificationContainer);
});
