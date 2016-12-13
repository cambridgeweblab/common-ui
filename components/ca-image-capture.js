define([
    './helpers/create-element.js',
    './helpers/clear-element.js',
    './helpers/cancel-event.js',
    'document-register-element'
], (createElement, clearElement, cancelEvent) => {
    /**
     * @exports ca-image-capture
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-image-capture') or included in a HTML page as an element.
     */
    class ImageCapture extends HTMLElement {

        /**
         * @description Executes when the element is attached to the DOM
         * @returns {undefined} attached calls the render method.
         */
        attachedCallback() {
            this.render();
        }

        /** @property {string} ca-image-capture.value - gets/sets base64 value of captured image */
        get value() {
            if (this.imageCaptured) {
                return this.canvasEl.toDataURL('image/jpeg', 0.8).replace('data:image/jpeg;base64,', '');
            }
            return '';
        }

        /** @param {string} value - gets/sets base64 value of captured image */
        set value(value) {
            // mark image as captured
            this.imageCaptured = true;

            // draw data uri to
            this.drawImage(value);
        }

        /** @property {integer} ca-image-capture.dataUri - returns data uri version of captured image */
        get dataUri() {
            return this.canvasEl.toDataURL('image/jpeg', 0.8);
        }

        /** @property {integer} ca-image-capture.videoWidth - width of the video stream to capture from */
        get videoWidth() {
            return parseInt(this.getAttribute('video-width') || '1280', 10);
        }

        /** @param {integer} value - width of the video stream to capture from */
        set videoWidth(value) {
            this.setAttribute('video-width', value || 1280);
        }

        /** @property {integer} ca-image-capture.videoHeight - height of the video stream to capture from */
        get videoHeight() {
            return parseInt(this.getAttribute('video-height') || '720', 10);
        }

        /** @param {integer} value - height of the video stream to capture from */
        set videoHeight(value) {
            this.setAttribute('video-height', value || 720);
        }

        /** @property {integer} ca-image-capture.imageCaptured - returns true if image has been captured, otherwise false */
        get imageCaptured() {
            return (this.getAttribute('image-captured') === 'true');
        }

        /** @param {boolean} value - returns true if image has been captured, otherwise false */
        set imageCaptured(value) {
            this.setAttribute('image-captured', value === true);
        }

        /**
         * @description Manages all internal events on an element
         * @param {object} e - the element that the event happened on
         * @returns {undefined}
         */
        eventHandler(e) {
            // eslint-disable-next-line no-param-reassign
            e = e || event;

            const el = e.target || e.srcElement;
            const tag = (el.tagName || '').toLowerCase();

            switch (tag) {
                case 'button': {
                    cancelEvent(e);
                    if (!this.imageCaptured) {
                        // capture image from video stream
                        this.captureImage();
                    } else {

                        // clear captured image
                        this.clearCapture();
                    }
                } break;

                default: break;
            }

            // Allow the event to bubble
            return true;
        }

        /**
         * @description Renders the element (invoked via render.call(this))
         * @returns {undefined} renders the element
         */
        render() {
            // clear this container incase we have been here before
            clearElement(this);

            // create a canvas element to be used to show the captred static image
            this.canvasEl = createElement(this, 'canvas', { width: this.videoWidth, height: this.videoHeight });

            // create video stream object - we capture stills by grabbing video stills
            this.videoEl = createElement(this, 'video', { muted: 'muted', autoplay: 'autoplay' });

            // normalise getUserMedia method across browsers
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

            if (navigator.getUserMedia) {

                // request acess to video stream
                navigator.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            minWidth: this.videoWidth,
                            maxWidth: this.videoWidth,
                            minHeight: this.videoHeight,
                            maxHeight: this.videoHeight
                        }
                    }
                },
                // fires once access granted
                (stream) => {
                    // modify the src with the URL to the browser created blob stream
                    this.videoEl.src = window.URL.createObjectURL(stream);
                },
                // fires if access is refused
                (e) => {
                    this.setAttribute('data-no-video', true);
                });
            }

            // add button to allow user to capture/clear image
            this.button = createElement(this, 'button', null, 'Capture');

            // hook all click events
            this.onclick = this.eventHandler.bind(this);
        }

        /**
         * Draws image based on dataUri
         * @param {string} dataUri, base64 image
         * @return {undefined}
         */
        drawImage(dataUri) {
            // get the canvas context for drawing
            const context = this.canvasEl.getContext('2d');
            let img = new Image();

            // draw image on canvas once loaded
            img.onload = function () {
                context.drawImage(img, 0, 0);
                img = null;
            };

            // load the data uri into an image object
            img.src = (dataUri.indexOf('data:image/jpeg;base64,') <= -1) ? `data:image/jpeg;base64,${dataUri}` : dataUri;
        }

        /**
         * Captures the image
         * @return {undefined}
         */
        captureImage() {
            // get the canvas context for drawing
            const context = this.canvasEl.getContext('2d');

            // draw the video contents into the canvas x, y, width, height
            context.drawImage(this.videoEl, 0, 0, this.canvasEl.width, this.canvasEl.height);

            // set ca-image-capture property to allow canvas to be shown and video hidden
            this.imageCaptured = true;
        }

        /**
         * Clears the capture image
         * @return {undefined}
         */
        clearCapture() {
            // get the canvas context for drawing
            const context = this.canvasEl.getContext('2d');

            // clear the canvas
            context.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

            // tweak property to hide canvas and show video stream
            this.imageCaptured = false;
        }
    }

    document.registerElement('ca-image-capture', ImageCapture);
});
