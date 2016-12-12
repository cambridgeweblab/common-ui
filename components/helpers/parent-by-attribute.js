define('parent-by-attribute', [], () =>
    // TODO: replace with Element.closest() and its polyfill for IE.
    /**
    * Walks up the DOM from the current node and returns an element where the attribute matches the value.
    * @param {object} el - element to indicate the DOM walking starting position
    * @param {string} attr - attribute/property name
    * @param {string} value - value of the attribute/property to match
    */
    function getParentByAttribute(el, attName, attValue) {
        const attributeName = (attName === 'class') ? 'className' : attName;
        const attributeValue = (attributeName === 'className') ? `(^|\\s)${attValue}(\\s|$)` : attValue;
        let tmp = el.parentNode;
        while (tmp !== null && tmp.tagName && tmp.tagName.toLowerCase() !== 'html') {
            if (tmp[attributeName] === attributeValue
                || tmp.getAttribute(attributeName) === attributeValue
                || (attributeName === 'className' && tmp[attributeName].matches(attributeValue))) {
                return tmp;
            }
            tmp = tmp.parentNode;
        }
        return null;
    }
);
