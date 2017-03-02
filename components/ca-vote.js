/* global api */
define(['./helpers/create-element.js', './helpers/clear-element.js', 'document-register-element'], (createElement, clearElement) => {
    const componentName = 'ca-vote';

    /**
     * Class Vote for a ca-vote web component.
     * This component is used to allow users to vote for prospective features in an application.
     * @extends HTMLElement
     */
    class Vote extends HTMLElement {

        /**
         * createdCallback - called when the component created, (not yet attached to the DOM).
         * @returns {undefined} initalises the component.
         */
        createdCallback() {
            this._storageKey = `${componentName}_${this.id}`;
            this.render();
        }

        /**
         * observedAttributes - get a list of attributes that should effect re-render.
         * @return {Array} list of attributes that effect a re-render.
         */
        static get observedAttributes() {
            return ['id'];
        }

        /**
         * @description Executes when any attribute is changed on the element
         * @type {Event}
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {void} void
         */
        attributeChangedCallback(attrName, oldVal, newVal) {

            if (attrName === 'id') {
                this._storageKey = `${componentName}_${this.id}`;
                this.render();
            }
        }

        /**
         * Gets ID under which this vote will be counted.
         * @returns {string} unique string ID for voted-for feature
         */
        get id() {
            return this.getAttribute('id') || '';
        }

        /**
         * Set ID under which this vote will be counted.
         * @param {string} id - unique string ID for voted-for feature
         */
        set id(id) {
            this.setAttribute('id', id || '');
        }

        /**
         * Gets key used for recording this vote in local storage to prevent double-voting.
         * This is defaulted to <code>ca-vote_<i>id</i></code>.
         * @returns {string} the key used as a double-vote check
         */
        get storageKey() {
            return this._storageKey;
        }

        /**
         * Gets the current displayed text in the control.
         * This property is reflected onto the <code>data-label</code> attribute.
         * Normally this is managed by the {@link Vote.render} method.
         * @returns {string} the current text being displayed
         */
        get label() {
            return this.getAttribute('data-label');
        }

        /**
         * Sets the current displayed text in the control.
         * This property is reflected onto the <code>data-label</code> attribute.
         * @param {string} label - the text to display in the control
         */
        set label(label) {
            this.setAttribute('data-label', label);
        }

        /**
         * Gets the current status of the vote button, either <code>disabled</code> or <code>enabled</code>.
         * This property is reflected onto the <code>data-status</code> attribute and used to disable the click behaviour
         * and affect the styling.
         * Normally this is managed by the {@link Vote.render} method.
         * @returns {string} the current status
         */
        get status() {
            return this.getAttribute('data-status');
        }

        /**
         * Sets the current status of the vote button, either <code>disabled</code> or <code>enabled</code>.
         * This property is reflected onto the <code>data-status</code> attribute and used to disable the click behaviour
         * and affect the styling.
         * Normally this is managed by the {@link Vote.render} method.
         * @param {string} value - the status to apply
         */
        set status(value) {
            this.setAttribute('data-status', value);
        }

        /**
         * Renders the ca-vote element
         * @returns {void} void
         */
        render() {
            clearElement(this);

            if (localStorage[this.storageKey]) {
                this.status = 'disabled';
                this.label = 'Thanks for your vote';
            } else {
                this.status = 'enabled';
                this.label = 'Vote for this feature';
            }

            this.button = createElement(this, 'button', null, this.label);
            this.button.onclick = this.eventDelegate.bind(this);
        }

        /**
         * eventDelegate use to bubble events up to consumer
         * @param {Event} e, event object.
         * @returns {undefined} void function.
         */
        eventDelegate(e = event) {

            const el = e.target || e.srcElement;
            const type = e.type.toLowerCase();
            const tag = el.tagName.toLowerCase();

            if (tag !== 'button') return;

            if (type === 'click') {
                if (this.status !== 'disabled') {
                    this.status = 'disabled';
                    el.innerText = 'Thanks for your vote';
                    localStorage[this.storageKey] = 'done';
                    api.postVote(this.id);
                }
            }
        }

    }

    document.registerElement(componentName, Vote);
});
