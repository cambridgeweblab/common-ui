define([
    './helpers/create-element.js',
    './helpers/clear-element.js',
    'document-register-element'
], (createElement, clearElement) => {
    /**
     * @exports ca-image-capture
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-image-capture') or included in a HTML page as an element.
     */
    class RemoteImageCapture extends HTMLElement {

        /**
         * @description Executes when the element is attached to the DOM
         * fires and event to ask for specific configuration
         * @returns {undefined}
         */
        attachedCallback() {
            const event = new CustomEvent('ca-config-component', {
                detail: {
                    config: [
                        { name: 'image-stream-url', localName: 'streamUrl', type: 'property' },
                        { name: 'image-capture-url', localName: 'captureUrl', type: 'property' },
                        { name: 'image-stream-height', localName: 'height', type: 'attribute' },
                        { name: 'image-stream-width', localName: 'width', type: 'attribute' }
                    ],
                    component: this
                },
                bubbles: true
            });
            this.dispatchEvent(event);
        }

        /**
         * @description Executes when any attribute is changed on the element
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {undefined}
         */
        attributeChangedCallback(attrName, oldVal, newVal) {
            // Only need to re-render the component if the attrbute value has changed
            if (oldVal !== newVal) {
                this.render.call(this);
            }
        }

        /** @property {Integer} ca-image-capture.height - gets the height */
        get height() {
            return parseInt(this.getAttribute('height') || '720', 10);
        }

        /** @param {Integer} value - sets the height */
        set height(value) {
            this.setAttribute('height', value || 720);
        }

        /** @property {Integer} ca-image-capture.width - gets the width */
        get width() {
            return parseInt(this.getAttribute('width') || '1280', 10);
        }

        /** @param {Integer} value - sets the height */
        set width(value) {
            this.setAttribute('width', value || 1280);
        }

        /** @property {Boolean} ca-image-capture.imageCaptured - gets the captured state */
        get imageCaptured() {
            return (this.getAttribute('image-captured') === 'true');
        }

        /** @param {Boolean} value - sets the captured state */
        set imageCaptured(value) {
            this.setAttribute('image-captured', value === true);
        }

        /** @property {String} ca-image-capture.streamUrl - sets the stream url */
        get streamUrl() {
            return this.imageStreamUrl;
        }

        /** @param {String} value - sets the stream url */
        set streamUrl(value) {
            this.imageStreamUrl = value;
        }

        /** @property {String} ca-image-capture.captureUrl - gets the capture url */
        get captureUrl() {
            return this.imageCaptureUrl;
        }

        /** @param {String} value - sets the capture url */
        set captureUrl(value) {
            this.imageCaptureUrl = value;
        }

        /** @property {String} ca-image-capture.value - gets the image base 64 val */
        get value() {
            if (this.imageCaptured) {
                return this.imageCanvas.toDataURL('image/jpeg', 0.8).replace('data:image/jpeg;base64,', '');
            }
            return '';
        }

        /**
         * @description Renders the element (invoked via render.call(this))
         * @returns {undefined}
         */
        render() {
            // only render based on these conditions.
            if (this.streamUrl && !this.imageCaptured) {
                // clear this container incase we have been here before
                clearElement(this);
                // create a canvas element to be used to show the captred static image
                this.imageCanvas = createElement(this, 'canvas', { width: this.width, height: this.height });
                this.imageTag = createElement(this, 'img', { src: this.streamUrl });

                // add button to allow user to capture/clear image
                this.button = createElement(this, 'button', null, 'Capture');

                this.button.onclick = this.handleCaptureClick.bind(this);
            }
        }

        /**
         * @description Handles the capture on click event
         * @param {event} event, the event object.
         * @returns {Boolean} it's a void function really...
         */
        handleCaptureClick(event) {
            event.preventDefault();
            // we haz our image, early return, peeps.
            if (this.imageCaptured) {
                this.imageCaptured = false;
                this.imageTag.src = this.streamUrl;
                return true;
            }

            this.imageTag.src = '';

            const responseImage = new Image();
            responseImage.onload = () => {
                this.imageCaptured = true;
                const canvasContext = document.querySelector('canvas').getContext('2d');
                canvasContext.drawImage(responseImage, 0, 0);
            };
            responseImage.onerror = () => {
                this.imageCaptured = false;
                this.imageTag.src = this.streamUrl;
            };
            responseImage.src = `${this.captureUrl}?cacheBuster=${Math.floor((Math.random() * 100000) + 1)}`;
            return true;
        }

    }

    document.registerElement('ca-remote-image-capture', RemoteImageCapture);
});
