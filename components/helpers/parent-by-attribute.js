define('parent-by-attribute', [], () =>
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
