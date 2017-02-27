define([], () => {

    /**
     * Select class for Radio Group Web component
     * @extends HTMLElement
     */
    class RadioGroup extends HTMLElement {

        /**
         * Called when element is initialised
         * @returns {void} void
         */
        createdCallback() {

            this.name = `radiogroup_${new Date().getTime()}`;
            this.data = [];
        }

        /**
         * Renders the ca-radio-group element
         * @returns {void} void
         */
        render() {

            if (!this.data || !this.data.type || this.data.type.length === 0) return;

            this.destroy();

            const container = document.createElement('fieldset');
            const questionText = document.createElement('h2');

            questionText.innerText = this.data.description;
            container.appendChild(questionText);

            this.data.type.forEach(question => {

                const label = document.createElement('label');
                label.innerText = question.title;
                container.appendChild(label);

                const radioButton = document.createElement('input');
                radioButton.value = question.enum[0];
                radioButton.type = 'radio';
                radioButton.name = this.name;
                label.appendChild(radioButton);
            });

            this.appendChild(container);
        }

        /**
         * Destroys HTML element
         * @returns {void} void
         */
        destroy() {

            this.innerHTML = '';
        }

        /**
         * Sets data
         * @param {object} data data
         * @returns {void} void
         */
        set data(data) {

            this._data = data || [];

            try {

                this.render();
            } catch (e) {

                this.destroy();
                this._data = [];
            }
        }

        /**
         * Gets data
         * @returns {object} data
         */
        get data() {

            return this._data;
        }

        /**
         * Sets value
         * @param {string} value value
         * @returns {void} void
         */
        set value(value) {

            const allItems = this.querySelectorAll('input[type="radio"]');

            allItems.forEach(item => {

                item.checked = (item.value === value); // eslint-disable-line
            });
        }

        /**
         * Gets value
         * @returns {string} value
         */
        get value() {

            const selectedItem = this.querySelector('input[type="radio"]:checked');
            return (selectedItem) ? selectedItem.value : null;
        }

        /**
         * Sets name
         * @param {string} name name
         * @returns {void} void
         */
        set name(name) {

            this.setAttribute('name', name);
        }

        /**
         * Gets name
         * @returns {string} name
         */
        get name() {

            return this.getAttribute('name');
        }
    }

    document.registerElement('ca-radio-group', RadioGroup);
});
