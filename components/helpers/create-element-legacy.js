define('create-element', ['./clear-element.js'], (clearElement) =>
    function createEl (parentEl, tagName, attrs, text, html, domEl) {

        const el = document.createElement(tagName);
        const customEl = tagName.indexOf('-') > 0;
        let key = '';

        if (attrs) {
            // eslint-disable-next-line
            for (key in attrs) {
                if (key === 'class') {
                    // assign className
                    el.className = attrs[key];
                } else if (key === 'style') {
                    // assign styles
                    el.setAttribute('style', attrs[key]);
                } else if (key === 'id') {
                    // assign id
                    el.id = attrs[key];
                } else if (key === 'name') {
                    // assign name attribute, even for customEl
                    el.setAttribute(key, attrs[key]);
                } else if (customEl || (key in el)) {
                    // assign object properties
                    el[key] = attrs[key];
                } else {
                    // assign regular attribute
                    el.setAttribute(key, attrs[key]);
                }
            }
        }

        if (typeof text !== 'undefined' && typeof text !== 'object') {
            el.appendChild(document.createTextNode(text));
        }
        if (typeof html !== 'undefined') {
            clearElement(el);
            el.textContent = html;
        }
        if (domEl) {
            el.appendChild(domEl);
        }
        if (parentEl) {
            parentEl.appendChild(el);
        }

        return el;
    }
);
