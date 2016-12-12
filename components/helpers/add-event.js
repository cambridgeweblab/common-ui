define('add-event', [], () =>
    function (el, type, func) {
        if (el.addEventListener) {
            el.addEventListener(type, func, false);
        } else if (el.attachEvent) {
            el.attachEvent(`on${type}`, func);
        }
    }
);
