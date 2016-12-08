// generic ajax request function
window.ajax = function(settings) {
    const type = settings.type || 'GET';
    const url = settings.url;

    // turns a key value pair object into a http key value pair
    const objectToFormPost = function(kvp) {
        const data = [];

        // get data into key value collection
        Object.keys(kvp).forEach(key => {
            // stop prototype functions from been converted into data
            if (Object.prototype.hasOwnProperty.call(kvp, key)) {
                data.push(`${key}=${encodeURIComponent(kvp[key])}`);
            }
        });

        // turn data into a string
        return data.join('&');
    };

    return new Promise((resolve, reject) => {
        const XHR = XMLHttpRequest || ActiveXObject;
        const request = new XHR('MSXML2.XMLHTTP.3.0');
        let data = settings.data || {};
        const isFormDataPost = (data.constructor === FormData);
        const contentType = settings.contentType || 'application/x-www-form-urlencoded';

        request.open(type, url, true);

        // dont add a content type when posting JS FormData data as the browser needs to add the boundry info
        if (type.toUpperCase() !== 'GET' && !isFormDataPost) {
            request.setRequestHeader('Content-type', contentType);
        }

        if (settings.headers) {
            Object.keys(settings.headers).forEach(header => {
                if (Object.prototype.hasOwnProperty.call(settings.headers, header)) {
                    request.setRequestHeader(header, settings.headers[header]);
                }
            });
        }

        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                const reqText = (request.responseText || '');
                const isJson = reqText.isJson();

                if (request.status >= 200 && request.status < 300) {
                    if (request.responseType === 'json') {
                        resolve(request.response);
                    } else if (settings.dataType === 'json' && isJson) {
                        resolve(JSON.parse(reqText));
                    } else {
                        resolve(reqText);
                    }
                } else {
                    if (request.status === 0 && url.startsWith('data:')) {
                        // The request failed, probably due to unhelpful CORS policy in Safari.
                        // See related WebKit bug https://bugs.webkit.org/show_bug.cgi?id=123978
                        // Manually process the URL instead...
                        console.log('Falling back to manual data: URI processing...');
                        const parsedDataUri = parseDataUri(url);
                        if (parsedDataUri) {
                            resolve(settings.dataType === 'json' && parsedDataUri.isJson() ? JSON.parse(parsedDataUri) : parsedDataUri);
                            return;
                        }
                    }
                    try {
                        reject([JSON.parse(reqText), request]);
                    } catch (e) {
                        reject([reqText, request]);
                    }
                }
            }
        };

        // TODO: Rework this function, its gettting hard to follow!
        if (type.toUpperCase() !== 'GET' && contentType === 'application/x-www-form-urlencoded' && typeof settings.data === 'object' && !isFormDataPost) {
            data = objectToFormPost(data);
        } else if (typeof settings.data !== 'string' && !isFormDataPost) { // dont stringify the browsers 'FormData' object
            // stringify objects
            data = JSON.stringify(settings.data);
        }

        try {
            request.send(data || '');
        } catch (e) {
            console.log(e);
        }
    });

    /**
     * Manually extract the data from the URI.
     * @param {string} href to target
     * @returns {string} encoded data
     */
    function parseDataUri(href) {
        const commaPos = href.indexOf(',');
        // header is of the form data:[<mediatype>][;base64]
        const header = href.substring(0, commaPos);
        let data = href.substring(commaPos + 1);
        if (header.endsWith(';base64')) {
            data = escape(window.atob(data));
        }
        return decodeURIComponent(data);
    }
};
