define('set-element-value', [], () =>
    function setElementValue (el, value) {

        const tag = (el) ? el.tagName.toLowerCase() : '';

        switch (tag) {

            case 'input': {

                switch (el.type || '') {

                    case 'checkbox': {
                        switch (value) {
                            case false:
                                el.removeAttribute('checked');
                                break;
                            case true:
                                el.setAttribute('checked', (value === true));
                                break;
                            default:
                                return true;
                        }
                    } break;

                    default: {
                        // eslint-disable-next-line no-param-reassign
                        el.value = value;
                    }
                }

            } break;

            case 'textarea': {
                // eslint-disable-next-line no-param-reassign
                el.value = (value.join) ? value.join('\n') : value;
            } break;

            default: {
                // eslint-disable-next-line no-param-reassign
                el.value = value;
            }
        }

        return null;

    }
);
