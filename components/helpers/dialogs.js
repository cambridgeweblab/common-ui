
define([
    './create-element-legacy.js',
    './parent-by-attribute.js',
    './cancel-event.js',
    './add-event.js',
    './has-class.js',
    './add-class.js',
    './remove-class.js',
    './clear-element.js'
], (createElement, parentByAttribute, cancelEvent, addEvent, hasClass, addClass, removeClass, clearElement) => {
    const dialogs = {
        // is the object ready for interaction ?
        ready: false,

        // items will contain a list of all open dialogs
        items: [],

        // configurable loading message, placeholder will be replace with either link title or inner text
        loadingMessage: 'Loading {0}, please wait...',

        // should the script override window.open calls?
        overrideDefaultWindows: true,

        events: {
            onbeforeopen(url, title) {
                return true;
            },
            onshow(dlg) {}
        },

        init() {

            if (/interactive|loaded|complete/i.test(document.readyState)) {

                // assign application wide event handler
                //  - if we have a top then use that as it ensures only one window is responsible for all dialogs, makes them stackable no matter how deep they open
                addEvent(document, 'click', window.top.dialogs._.eventDelegate || dialogs._.eventDelegate);

                // override window.open if required (if no name provided need to create a temp in order to close!!)
                if (dialogs.overrideDefaultWindows) {
                    window.open = dialogs.open;
                    window.alert = dialogs.alert;
                    window.confirm = dialogs.confirm;
                }

                dialogs.ready = true;
            }

            return dialogs.ready;
        },

        // returns a dialog object where name matches
        get(id) {
            return dialogs.items.find(item => item.id === id);
        },

        // closes a dialog where the name matches
        close(id) {
            const dlg = dialogs.get(id);

            if (dlg) {
                // close the dialog
                dlg.close();
            }
        },

        closeAll() {
            let len = dialogs.items.length;

            while (len--) {
                dialogs.items[len].close();
            }
        },

        alert(message, title, buttons, callback, css) {
            // eslint-disable-next-line no-param-reassign
            css = (css) ? `dialog-alert ${css}` : 'dialog-alert';

            // add window to dialogs collection
            // eslint-disable-next-line
            dialogs.items.push(new dialogs._.create(null, {
                id: 'alert',
                mask: true,
                autoshow: true,
                fullscreen: false,
                css,
                bodycss: 'no-scroll',
                title: title || 'Alert',
                html: message,
                buttons: buttons || ['Ok'],
                callback: callback || function() {}
            }));
        },

        confirm(message, title, callback, css, buttons) {

            // eslint-disable-next-line no-param-reassign
            css = (css) ? `dialog-confirm ${css}` : 'dialog-confirm';
            // eslint-disable-next-line no-param-reassign
            buttons = buttons || ['Yes', 'No'];

            // add window to dialogs collection
            // eslint-disable-next-line
            dialogs.items.push(new dialogs._.create(null, {
                id: 'confirm',
                mask: true,
                autoshow: true,
                fullscreen: false,
                css,
                bodycss: 'no-scroll',
                title: title || 'Confirm',
                html: message,
                buttons,
                callback
            }));
        },

        /**
         * creates an internal dialog window
         * @param {string} url - url to load into the dialog
         * @param {object} features - a comma separated list of dialog settings (similar to classic window.open)
         * Example: dialogs.open('heep://www.google.com','title=My Dialog, width=300px, height=200px, fullscreen=no, mask=true');
         * @returns {dialog} the opened dialog.
         */
        open(url, features) {
            // <remarks>if title is null and the window was opened from a hyperlink, the inner text of the links is used as the dialog title</remarks>

            // convert features csv into key/value object it its a string
            const params = (typeof features === 'string') ? dialogs._.convertParamsToObject(features) : features;

            // create the new dialog
            // eslint-disable-next-line new-cap
            const dlg = new dialogs._.create(url, params);

            // add to dialogs collection so it can be accessed by name or all
            dialogs.items.push(dlg);

            // return the custom dialog object for this new window
            return dlg;
        },

        /* private stuff */
        _: {

            convertParamsToObject(features) {

                const params = {
                    type: 'window'
                };
                const items = (features) ? features.split(',') : [];

                for (let i = 0; i < items.length; i++) {
                    const kvp = items[i].split('=');
                    const val = kvp[1] || '';
                    params[kvp[0]] = (val.indexOf('|') > -1) ? val.split('|') : val;
                }

                return params;
            },

            // store the old window functions in case we encounter an unsupported browser
            oldWindowOpen: window.open,
            oldAlert: window.alert,
            oldConfirm: window.confirm,

            // get text property name for this browser
            txtProp: ('textContent' in document.createElement('span')) ? 'textContent' : 'innerText',

            eventDelegate(e) {
                // eslint-disable-next-line no-param-reassign
                e = e || event; // resolve event object
                let el = e.target || e.srcElement; // get event target

                // get parent A tag is it exists
                el = (el.tagName !== 'A') ? parentByAttribute(el, 'tagName', 'A') : el;

                if (!el || el.tagName !== 'A') {
                    return;
                }

                const url = el.href;
                const settings = el.getAttribute('data-dialog') || null;

                if (!settings) return;

                if (url !== '' && url !== '#' && dialogs.events.onbeforeopen.call(el)) {
                    // open the link in an internal window (use either title or inner text as the dialog title)
                    dialogs.open(url, settings);

                    cancelEvent(e);
                }
            },

            // TODO: had to disable lint as this is being used as contructor
            // Object short hand cannot be used as a constructor
            // creates an internal dialog window
            // eslint-disable-next-line object-shorthand
            create: function(url, params) {
                // <summary>creates an internal dialog window</summary>
                // <param name="url" type="String">the url to load</param>
                // <param name="name" optional="true" type="String">the unique name to assign to the dialog (required if a call to dialogs.close is needed)</param>
                // <param name="params" optional="true" type="String">a comma separated list of dialog settings
                //  <example>title=My Dialog, width=300px, height=200px, fullscreen=true, mask=true|false</example>
                // </param>

                const dlg = this;
                const body = document.body;

                // assign parameters
                dlg.params = params || {};
                dlg.params.width = (dlg.params.width) ? parseInt(dlg.params.width, 10) : -1;
                dlg.params.height = (dlg.params.height) ? parseInt(dlg.params.height, 10) : -1;
                dlg.params.title = (dlg.params.title) ? dlg.params.title : '';
                dlg.params.fullscreen = (dlg.params.fullscreen === 'true');
                dlg.params.mask = (dlg.params.mask !== 'false');
                dlg.params.css = (dlg.params.css) ? dlg.params.css : '';
                dlg.params.html = (dlg.params.html) ? dlg.params.html : '';
                dlg.params.text = (dlg.params.text) ? dlg.params.text : '';
                dlg.params.callback = params.callback || function() {};
                // dlg.params.autoshow = /false/i.test(params.autoshow);
                dlg.params.modal = (params.modal === 'true' || params.modal);
                dlg.params.method = (params.method === 'ajax' && window.ajax) ? 'ajax' : 'iframe';
                // dlg.params.bodycss = (dlg.params.bodycss) ? dlg.params.bodycss : '' ? ;

                dlg.id = dlg.params.id || `dlg${(new Date()).getTime()}`; // might need to check if it's already in use and if so alter it!?

                if (dlg.params.bodycss) {
                    addClass(body, dlg.params.bodycss);
                }

                // create style object if dimensions exist, otherwise fall back to css assigned values
                const style = (dlg.params.width > -1 && dlg.params.height > -1) ? {
                    width: `${dlg.params.width}px`,
                    height: `${dlg.params.height}px`
                } : {};

                // if the mask is required, insert it
                if (dlg.params.mask || dlg.params.modal) {
                    dlg.mask = createElement(body, 'div', {
                        class: `dialog-mask ${dlg.id}-mask`
                    });
                }

                if (dlg.mask && !dlg.params.modal) {
                    dlg.mask.onclick = function(e) {
                        // eslint-disable-next-line no-param-reassign
                        e = e || event;
                        const el = e.target || e.srcElement;
                        const css = el.className || '';

                        if (hasClass(el, 'dialog-mask')) {
                            dialogs.get(dlg.id).close();
                        }
                    };
                }

                if (params.title === '') {
                    dlg.params.css += ' dialog-no-title';
                }

                // create and insert the window
                dlg.dialog = createElement(dlg.mask || body, 'div', {
                    id: dlg.id,
                    class: `dialog dialog-offscreen ${dlg.params.css}`,
                    style
                });
                dlg.closeIcon = (!dlg.params.modal) ? createElement(this.dialog, 'span', {
                    class: 'dialog-close'
                }, 'x') : null;
                if (params.title !== '') {
                    dlg.title = createElement(this.dialog, 'h1', {
                        class: 'dialog-title'
                    }, params.title);
                }
                dlg.body = createElement(this.dialog, 'div', {
                    class: 'dialog-body'
                }, dlg.params.text, dlg.params.html);
                dlg.loadingMessage = createElement(this.body, 'span', {
                    class: 'loading-message'
                });
                dlg.iframe = createElement(null, 'iframe', {
                    frameBorder: '0',
                    border: '0'
                });
                dlg.buttons = createElement(null, 'div', {
                    class: 'dialog-buttons'
                });

                (dlg.writeButtons = function(buttons) {
                    clearElement(dlg.buttons);

                    if (buttons && buttons.length > 0) {

                        const buttonClickHandler = function(e) {
                            // eslint-disable-next-line no-param-reassign
                            e = e || event; // resolve event object
                            const el = e.target || e.srcElement; // get event target

                            cancelEvent(e);

                            // TODO: Add check here to only call close if callback did not return false!
                            dlg.close.call(null, el[dialogs._.txtProp]);
                        };

                        for (let i = 0, l = buttons.length; i < l; i++) {
                            const link = createElement(dlg.buttons, 'a', {
                                href: '#',
                                class: `dialog-button dialog-button-${buttons[i].toLowerCase().replace(' ', '-')}`
                            }, buttons[i]);

                            link.onclick = buttonClickHandler;
                        }

                        dlg.dialog.appendChild(dlg.buttons);
                    } else {
                        // eslint-disable-next-line no-lonely-if
                        if (dlg.buttons.parentNode) {
                            dlg.buttons.parentNode.removeChild(dlg.buttons);
                        }
                    }
                })(params.buttons);

                // workout rendered dimensions and centre using negative margins (only if we have dimensions as params)
                if (dlg.params.width > -1 && dlg.params.height > -1) {
                    dlg.dialog.style.margin = `-${dlg.dialog.offsetHeight / 2}px 0 0 -${dlg.dialog.offsetWidth / 2}px`;
                }

                // iframe.onload does not fire in IE, therefore create a method IE can use to check if the iframe has loaded
                // eslint-disable-next-line consistent-return
                dlg.iframe._loading = function() {
                    const frameDoc = dlg.iframe.document || dlg.iframe.contentWindow.document;

                    if (frameDoc && /complete/i.test(frameDoc.readyState)) {
                        dlg.iframe._loaded();
                        return true;
                    }
                };

                // once the iframe has loaded, this function is called to remove the 'dialog-loading' class allowing the contents to be displayed
                dlg.iframe._loaded = function() {
                    dlg.dialog.className = dlg.dialog.className.replace(/ dialog-loading/gi, '');
                    document.title = dlg._docTitle;
                };

                // create a load method on the dialog, calling this turns on the loading mask and sets the source
                dlg.load = function(src, title) {

                    // cache original document title
                    dlg._docTitle = document.title;

                    // assign the loading message to dialog and document title
                    // TODO: clean up the string formatting.
                    document.title = dlg.loadingMessage[dialogs._.txtProp] = `Loading ${title}, please wait...`;

                    // assign loading class (hides iframe and shows loading gif/message)
                    dlg.dialog.className += ' dialog-loading';

                    // for all other browsers, when the iframe has loaded call a function to remove the loading class
                    dlg.iframe.onload = function() {
                        dlg.iframe._loaded();
                    };

                    // assign the source
                    dlg.iframe.src = src;
                };

                // injects HTML into the dialog
                dlg.write = function(html, title) {

                    // remove the iframe if it exists
                    if (dlg.iframe.parentNode) {
                        dlg.iframe.parentNode.removeChild(dlg.iframe);
                    }

                    // set the title if its present
                    if (dlg.title) {
                        dlg.title[dialogs._.txtProp] = title || dlg.title[dialogs._.txtProp];
                        // Update dialog CSS
                        dlg.dialog.classList.remove('dialog-no-title');
                    }

                    // insert the HTML
                    clearElement(dlg.body);
                    html.toDOM(dlg.body);
                };

                dlg.writeCss = function(cssClass) {
                    const classList = dlg.dialog.classList;
                    const classesToRemove = [];
                    for (let i = 0; i < classList.length; i++) {
                        const existingClass = classList.item(i);
                        // TODO: nasty hack over animated and fadeInDown here...
                        if (existingClass !== 'dialog' && existingClass.indexOf('dialog-') < 0 && existingClass !== 'animated' && existingClass !== 'fadeInDown') {
                            classesToRemove.push(existingClass);
                        }
                    }
                    classesToRemove.forEach(existingClass => {
                        classList.remove(existingClass);
                    });
                    classList.add(cssClass);
                };

                // when executed, attempts to stops the iframe from loading its contents (only works for local content)
                dlg.stop = function() {

                    try {
                        // reset document title
                        if (dlg._docTitle) {
                            document.title = dlg._docTitle;
                        }

                        if (window.stop && dlg.iframe.contentWindow && dlg.iframe.contentWindow.stop) {
                            dlg.iframe.contentWindow.stop();
                        } else {
                            const doc = ((dlg.iframe.contentWindow || {}).document || dlg.iframe.contentDocument || dlg.iframe.document);
                            // TODO: umm. a little crazy, but it must be migrated.
                            // eslint-disable-next-line no-undef
                            if (doc && execCommand) {
                                doc.execCommand('Stop');
                            }
                        }
                        // eslint-disable-next-line
                    } catch (e) {}

                };

                dlg.show = function() {

                    if (!dlg.params.fullscreen && dlg.params.width < 0 && dlg.params.height < 0) {

                        // eslint-disable-next-line
                        const marginLeft = parseInt(dlg.dialog.offsetWidth / 2);
                        // eslint-disable-next-line
                        const marginTop = parseInt(dlg.dialog.offsetHeight / 2);

                        addClass(dlg.dialog, 'dialog-autoshow');
                    }

                    removeClass(dlg.dialog, 'dialog-offscreen');

                    if (dlg.mask) {
                        dlg.mask.setAttribute('data-dialog-visible', 'true');
                    }

                    // fire onshow event handler
                    if (dialogs.events.onshow) {
                        dialogs.events.onshow(dlg);
                    }
                };

                // when executed, remove the dialog from the browser
                // eslint-disable-next-line consistent-return
                dlg.close = function(buttonName) {

                    // stop the iframe from loading...
                    dlg.stop();

                    // execute callback method
                    if (dlg.params.callback.call(null, buttonName) === false) return false;

                    // remove mask
                    dlg.mask.style.display = 'none';

                    if (dlg.mask.parentNode) {
                        dlg.mask.parentNode.removeChild(dlg.mask);
                    }

                    dlg.dialog.style.display = 'none';
                    if (dlg.dialog.parentNode) {
                        dlg.dialog.parentNode.removeChild(dlg.dialog);
                    }

                    // remove noscroll from body
                    if (dlg.params.bodycss) {
                        removeClass(body, dlg.params.bodycss);
                    }

                    // find dialog in collection
                    const idx = dialogs.items.findIndex(item => item.id === dlg.id);

                    // remove the dialog from the items collection
                    if (idx > -1) {
                        dialogs.items.splice(idx, 1);
                    }
                };

                if (!dlg.params.modal) {
                    dlg.closeIcon.onclick = function() {
                        dialogs.close.call(null, dlg.id);
                    };
                }

                if (dlg.params.autoshow) {
                    dlg.show();
                }

                // apply fullscreen styles if required
                if (dlg.params.fullscreen) {
                    dlg.dialog.className += ' fullscreen';
                }

                if (url) {

                    switch (dlg.params.method) {
                        case 'iframe':
                            // insert the iframe
                            this.body.appendChild(dlg.iframe);

                            // load the url
                            dlg.load(url, dlg.params.title);
                            break;

                        case 'ajax':
                            // add ajax loading logic here
                            break;

                        default: break;
                    }

                }

                return dlg;
            }
        }
    };

    return dialogs;
});
