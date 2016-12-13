define([
    '/components/helpers/create-element.js',
    '/components/helpers/parent-by-attribute.js',
    '/components/helpers/cancel-event.js',
    '/components/helpers/is-mobile.js',
    '/components/helpers/component-support.js',
    'pikaday',
    'document-register-element'
], (createElement, parentByAttribute, cancelEvent, isMobile, componentSupport, Pikaday) => {
    /**
     * @exports ca-datetime
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-datetime') or included in a HTML page as an element.
     */
    class DateTime extends HTMLElement {

        /**
         * @description Executes when the element is first created
         * @return {undefined}
         */
        createdCallback() {
            const div = createElement(this, 'div', {});
            const input = createElement(div, 'input', {});
            this.root = div;
        }

        /**
         * @description Executes when any attribute is changed on the element
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {undefined}
         */
        attributeChangedCallback(attrName, oldVal, newVal) {
            // Reflect validation attributes onto the inner input field.
            if (attrName === 'pattern' || attrName === 'required' || attrName === 'placeholder') {
                this.input.setAttribute(attrName, newVal);
            }
        }

        /** @property {string} ca-datetime.type - the type of datetime object you want */
        get type() {
            return this._type;
        }

        /** @param {string} value, sets the type of datetime object you want */
        set type(value) {
            this._type = value;
            this.render();
        }

        /** @property {string} ca-datetime.value - the value behind the component */
        get value() {
            if (!this.datePicker) {
                return this.input.value || '';
            } else if (!this.datePicker && this.type === 'datetime-local') {
                return `${this.input.value} ${this.timeInput.value}`;
            }

            const inputValue = this.input.value || '';
            const inputRaw = this.input._raw;
            const inputTime = this.timeInput && this.timeInput.value;

            if (inputRaw && inputRaw !== '') {
                switch (this.type) {
                    case 'date': return this.jsDateToLocalDateString(inputRaw);
                    case 'time': return this.jsDateToTimeString(inputRaw);
                    case 'datetime': return this.jsDateToDateTimeString(inputRaw, inputTime);
                    case 'datetime-local': return this.jsDateToLocalDateTimeString(inputRaw, inputTime);
                    case 'birth-date': return this.jsDateToLocalDateString(inputRaw);
                    default: return this.jsDateToLocalDateTimeString(inputRaw);
                }
            }
            return inputValue;
        }

        /** @param {string} value, sets the value behind the component */
        set value(value) {
            if (!this.datePicker) {
                this.input.value = value;
            } else {
                this.input._raw = value;
                switch (this.type) {
                    case 'date':
                    case 'birth-date':
                        this.input.value = this.formatDateForDisplay(value);
                        break;
                    case 'datetime-local':
                    case 'datetime':
                        this.input.value = this.formatDateForDisplay(value);
                        this.timeInput.value = this.formatTimeForDisplay(value);
                        break;
                    default:
                        this.input.value = value.toString();
                }
            }

            this.setAttribute('value', this.value);
            this.setAttribute('display-value', this.input.value);
        }

        // TODO: this is nonsense, sort it out
        /** @property {string} ca-datetime.date - the date part of the selected datetime */
        get date() {
            return this.value;
        }

        // TODO: this is nonsense, sort it out
        /** @property {string} ca-datetime.time - the time part of the selected datetime */
        get time() {
            return this.value;
        }

        /** @property {string} ca-datetime.time - the time part of the selected datetime */
        get datePicker() {
            return this._datePicker;
        }

        /** @param {string} value - the time part of the selected datetime */
        set datePicker(value) {
            this._datePicker = value;
        }

        /**
         * @description Converts a date to the ISO local date time (floating date time) format (without a timezone).
         * @param {string|Object} date either a JS date or a String representation of a date
         * @param {string} time to append to date.
         * @return {string} the date in format YYYY-MM-DDTHH:MM:SS.000
         */
        jsDateToLocalDateTimeString(date, time) {
            const datetime = typeof date === 'string' ? new Date(date) : date;
            return `${datetime.getFullYear()}-${(`0${datetime.getMonth() + 1}`).slice(-2)}-${(`0${datetime.getDate()}`).slice(-2)}T${time}`;
        }

        /**
         * @description Converts a date to the ISO date time (absolute date time) format (in UTC).
         * @param {string|Object} date either a JS date or a String representation of a date
         * @param {string} time in string.
         * @return {string} the date in format YYYY-MM-DDTHH:MM:SS.000Z
         */
        jsDateToDateTimeString(date, time) {
            const splitTime = (time) ? time.split(':') : ['0', '0', '0'];
            const datetime = typeof date === 'string' ? new Date(date) : date;
            datetime.setHours(parseInt(splitTime[0], 10), parseInt(splitTime[1], 10));
            return datetime.toISOString();
        }

        /**
         * @description Converts a date to an ISO local date (floating date) format (without a timezone).
         * @param {string|Object} date either a JS date or a String representation of a date
         * @return {string} the date in format YYYY-MM-DD
         */
        jsDateToLocalDateString(date) {
            const datetime = typeof date === 'string' ? new Date(date) : date;
            return `${datetime.getFullYear()}-${(`0${datetime.getMonth() + 1}`).slice(-2)}-${(`0${datetime.getDate()}`).slice(-2)}`;
        }

        /**
         * @description Converts a date to an ISO local time (floating time) format (without a timezone or date).
         * @param {string|Object} date either a JS date or a String representation of a date
         * @return {string} the time in format HH:MM:SS.000
         */
        jsDateToTimeString(date) {
            const datetime = typeof date === 'string' ? new Date(date) : date;
            return `${(`0${datetime.getHours()}`).slice(-2)}:${(`0${datetime.getMinutes()}`).slice(-2)}:${(`0${datetime.getSeconds()}`).slice(-2)}.000`;
        }

        /**
         * @description Method to clear the value in the date time text box
         * @param {HTMLElement} clearBtn, clicked button.
         * @returns {undefined}
         */
        clearInput(clearBtn) {
            this.input._raw = '';
            this.input.value = '';
            if (this.timeInput) {
                this.timeInput.value = '';
            }
            // eslint-disable-next-line no-param-reassign
            clearBtn.style.display = 'none';
            this.clearRequired();
        }

        /**
         * @description Method to clear the required indicator
         * @return {undefined}
         */
        clearRequired() {
            const lbl = parentByAttribute(this, 'tagName', 'LABEL');

            if (lbl) {
                const required = lbl.getAttribute('class') === 'required';
                lbl.setAttribute('class', (required) ? 'required' : '');
            }
        }

        /**
        * @description Formats date based on browser/language/locale settings
        * @param {date} date - date object to format
        * @returns {date} localised date
        */
        formatDateForDisplay(date) {
            const language = componentSupport.getUserLanguage();
            return new Date(date).toLocaleDateString(language);
        }

        /**
         * @description Formats time based on browser/language/locale settings
         * @param {date} date - date object to format
         * @returns {string} time for display
         */
        formatTimeForDisplay(date) {
            const language = componentSupport.getUserLanguage();
            let ret = new Date(date).toLocaleTimeString(language, { hour12: false });

            // time input format is "HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS" where HH is 00-23, mm is 00-59, ss is 00-59, and SSS is 000-999
            // so if the value comes back as say "0:00:00" (ie the ':' is in position 1) then need to add a leading 0
            if (ret.indexOf(':') === 1) {
                ret = `0${ret}`;
            }
            return ret;
        }

        /**
         * @description Formats date+time based on browser/language/locale settings
         * @param {date} date - date object to format
         * @returns {string} date for display
         */
        formatDateTimeForDisplay(date) {
            const language = componentSupport.getUserLanguage();
            const d = new Date(date);
            return `${d.toLocaleDateString(language)} ${d.toLocaleTimeString(language)}`;
        }

        /**
         * @description Create the structure behind the component
         * @returns {undefined} void function that performs the rendering.
         */
        render() {
            const type = this._type;
            const clearBtn = createElement(this.root, 'button', { class: 'clear' }, '');

            const onSelectPikaday = (pickDate) => {
                this.value = pickDate;
                clearBtn.style.display = 'block';
                this.clearRequired();
            };

            this.input = this.root.querySelector('input');

            if ((type !== 'time' && !isMobile()) || type === 'datetime-local') {
                if (type === 'datetime-local' && isMobile()) {
                    this.input.type = 'date';
                    this.timeInput = createElement(this.root, 'input', { type: 'time' }, null);
                } else {
                    switch (type) {
                        case 'datetime':
                        case 'datetime-local':
                            this.input.type = 'text';
                            this.timeInput = createElement(this.root, 'input', { type: 'time' }, null);
                            this.datePicker = new Pikaday({
                                field: this.input,
                                showTime: false,
                                onSelect: onSelectPikaday
                            });
                            break;
                        case 'date':
                            this.input.type = 'text';
                            this.datePicker = new Pikaday({
                                field: this.input,
                                showTime: false,
                                onSelect: onSelectPikaday
                            });
                            break;
                        case 'birth-date':
                            this.input.type = 'text';
                            this.datePicker = new Pikaday({
                                field: this.input,
                                maxDate: new Date(),
                                yearRange: 100,
                                showTime: false,
                                onSelect: onSelectPikaday
                            });
                            break;
                        default: break;
                    }
                }
                this.input.setAttribute('readonly', 'readonly');
            } else {
                // "birth-date" is not a valid HTML5 input type so intercept; all other types are valid
                this.input.type = (type === 'birth-date' ? 'date' : type);
            }

            clearBtn.onclick = (e) => {
                cancelEvent(e || event);
                this.clearInput(clearBtn);
            };
        }
    }

    document.registerElement('ca-datetime', DateTime);
});
