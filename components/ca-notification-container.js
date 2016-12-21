define(['./helpers/create-element.js', './helpers/types.js', './ca-notification.js', 'document-register-element'], (createElement, types) => {
    /**
     * Class NotificationContainer for a NotificationContainer web component
     * @extends HTMLElement
     */
    class NotificationContainer extends HTMLElement {
        /**
        * Create a HTMLElement
        * @param {number} self - simply a hack for a polyfill to allow v1 web components.
        * @returns {undefined} initalises the component.
        */
        createdCallback() {
            this._closeStack = [];
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
        * timeout - get timeout that overrides notification timeouts.
        * @return {string} list of defered close functions.
        */
        get timeout() {
            return this.getAttribute('timeout');
        }

        /**
        * timeout - set a timeout value that overrides notification timeouts.
        * @param {integer} value - timeout override
        * @return {void} undefined implicit return.
        */
        set timeout(value) {
            this.getAttribute('timeout', value);
        }

        /**
        * addNotification - function to manage the attachment of notifications
        * @param {ca-notification} notification to append to container.
        * @return {void} undefined implicit return.
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

    document.registerElement('ca-notification-container', NotificationContainer);
});
