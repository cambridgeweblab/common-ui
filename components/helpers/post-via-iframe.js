define('post-via-iframe', ['./create-element.js'], createElement =>
    /**
      * Sends data to the server via a form post in a hidden frame
      * @param {string} url - url to post the data to
      * @param {object} data - JSON key/value object - a hidden field is created for each key
      */
    function postViaIframe(url, data) {
        const targetName = `_post_via_iframe_${Date.now()}`;
        const iframe = createElement(document.body, 'iframe', {
            src: '',
            name: targetName,
            style: 'display: none; visibility: hidden;'
        });
        const form = createElement(document.body, 'form', {
            action: url,
            enctype: 'application/x-www-form-urlencoded',
            method: 'POST',
            target: targetName,
            style: 'display: none !important'
        });

        Object.keys(data).forEach(key => {
            createElement(form, 'input', {
                type: 'hidden',
                name: key,
                value: data[key]
            });
        });

        form.submit();
    }
);
