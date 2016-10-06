define('create-element', [], () =>
    function createElement(parentElement, tagName, attributes, text) {
        const element = document.createElement(tagName);
        const keys = Object.keys(attributes || {});

        keys.forEach((key) => {
            if (key === 'class') {
                // assign className
                element.className = attributes[key];
            } else if (key === 'id') {
                // assign id
                element.id = attributes[key];
            } else {
                // assign regular attribute
                element.setAttribute(key, attributes[key]);
            }
        });

        if (text) {
            element.textContent = text;
        }
        if (parentElement) {
            parentElement.appendChild(element);
        }

        return element;
    }
);
