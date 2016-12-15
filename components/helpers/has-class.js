define('has-class', [], () =>
    function (el, cls) {
        return el.className.match(new RegExp(`(\\s|^)${cls}(\\s|$)`));
    }
);
