define('clear-element', [], () =>
    function clearElement(el) {
        while (el && el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
);
