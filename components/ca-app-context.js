define(['document-register-element'], () => {
    /**
     * @exports ca-app-context
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-app-context') or included in a HTML page as an element.
     */
    class AppContext extends HTMLElement {
        /**
         * @description Executes when the element is first created
         * @returns {undefined} simply creates an event listener.
         */
        createdCallback() {
            // listen on the window for this change.
            window.addEventListener('ca-config-component', this.componentConfigHandler);
        }

        /**
         * Listens for a ca-config-component event and updates web component if config is found.
         * @param {event} event request confiuration.
         * @return {undefined} void function that updates a web component
         */
        componentConfigHandler(event) {
            const detail = event.detail;
            const element = detail.component;
            const config = detail.config || [];
            config.forEach(configItem => {
                const propName = `data-${configItem.name}`;
                const propValue = this.getAttribute(propName);
                if (propValue) {
                    // if it isn't an attribute then assume it's a property
                    // if we get more than two cases then we should use a switch
                    if (configItem.type === 'attribute') {
                        element.setAttribute(configItem.localName, propValue);
                    } else {
                        element[configItem.localName] = propValue;
                    }
                }
            });
        }
    }
    // Register our new element
    document.registerElement('ca-app-context', AppContext);
});
