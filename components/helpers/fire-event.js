define('fire-event', [], () =>
    /**
     * Cross browser method to fire events.
     *
     * @param {HTMLElement} el - target DOM element to fire the event at.
     * @param {string} eventName - the name of the event to fire.
     * @returns {undefined}
     */
    function fireEvent(el, eventName) {
        if (document.createEvent) {
            const e = document.createEvent('Event');
            e.initEvent(eventName, true, true);
            el.dispatchEvent(e);
        } else if (document.createEventObject) {
            el.fireEvent(`on${eventName}`);
        } else if (typeof el[`on${eventName}`] === 'function') {
            el[`on${eventName}`]();
        }
    }
);
