define('cancel-event', [], () =>
    function cancelEvent(e) {
        const event = e || window.event;
        if (event) {
            event.returnValue = false;
            event.cancelBubble = true;
            if (typeof (event.preventDefault) === 'function') {
                event.preventDefault();
            }
            if (typeof (event.stopPropagation) === 'function') {
                event.stopPropagation();
            }
        }
    }
);
