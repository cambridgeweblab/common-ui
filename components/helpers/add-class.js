define('add-class', ['/components/helpers/has-class.js'], (hasClass) =>
    function (el, cls) {
        if (!hasClass(el, cls)) {
            // eslint-disable-next-line no-param-reassign
            el.className += ` ${cls}`;
        }
    }
);
