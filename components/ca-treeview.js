define(
['/components/helpers/create-element.js', '/components/helpers/parent-by-attribute.js', '/components/helpers/cancel-event.js', 'document-register-element'],
(createElement, parentByAttribute, cancelEvent) => {
    /**
     * Class TreeView for a TreeView web component
     * @extends HTMLElement
     */
    class TreeView extends HTMLElement {
        /**
         * createdCallback is called when the component is first created.
         * creates children, binds events and loads data if src is avaliable.
         * @returns {undefined} nothing.
         */
        createdCallback() {
            this.nav = createElement(this, 'nav', {});
            this.ol = createElement(this.nav, 'ol');
            this.nav.onclick = this.eventDelegate.bind(this);

            if (this.dataSrc) {
                this.loadData();
            }
        }

        /**
         * Called every time an attribute is changed.
         * @param {string} attrName, the name of the changed attribute.
         * @param {string} oldVal, previous value associated with attribute.
         * @param {string} newVal, current value associated with attribute.
         * @returns {undefined} if data-src or data-root change, then trigger data fetch.
         */
        attributeChangedCallback(attrName, oldVal, newVal) {
            switch (attrName) {
                case 'data-src': {
                    if (newVal !== '') {
                        this.loadData();
                    }
                } break;

                case 'data-root': {
                    this.root = newVal;
                } break;

                default: break;
            }
        }

        /**
         * Gets the root attribute
         * @returns {string} data-root attribute, default is empty.
         */
        get root() {
            return this.getAttribute('data-root') || '';
        }

        /**
         * Gets the root attribute
         * @param {string} value, data-root attribute, default is empty.
         */
        set root(value = '') {
            this.setAttribute('data-root', value);
        }

        /**
         * Gets the data-src
         * @returns {string} data-src attribute.
         */
        get dataSrc() {
            return this.getAttribute('data-src');
        }

        /**
         * Sets the data-src
         * @param {string} value, sets the data-src attribute.
         */
        set dataSrc(value) {
            this.setAttribute('data-src', value);
        }

        /**
         * Get the data
         * @returns {array} returns the data.
         */
        get data() {
            return this._data || [];
        }

        /**
         * Sets the data
         * @param {array} value, array to set as the data, defaults to empty. Invokes render.
         */
        set data(value = []) {
            this._data = value;
            this.render();
        }

        /**
         * Gets selected item
         * @returns {HTMLElement} selected Item
         */
        get selected() {
            return this._selected;
        }

        /**
         * Sets the selected item.
         * @param {HTMLElement} el current element.
         * @returns {int} max-children.
         */
        set selected(el) {
            this._selected = el;
        }

        /**
         * Gets the max children allowed.
         * @returns {int} max-children.
         */
        get maxChildren() {
            return parseInt(this.getAttribute('data-max-children') || '0', 10);
        }

        /**
         * Sets the max children allowed.
         * @param {int} value number of allow childre, defaults to 0.
         */
        set maxChildren(value = 0) {
            this.setAttribute('data-max-children', parseInt(value, 10));
        }

        /**
         * Load the data via an XHR request.
         * @param {HTMLElement} parent to render with data.
         * @param {string} dataSrc, url to load data form.
         * @returns {undefined} either data is loaded or render is called.
         */
        loadData(parent, dataSrc) {
            const dataSource = dataSrc || this.dataSrc;
            ajax
                .execute({ url: dataSource, dataType: 'json' })
                .then(data => {
                    // if this is a schema with instance links, grab the instance url
                    const instancesUrl = (data.$schema && data.items.links) ? (data.items.links.find(link => link.rel === 'instances') || {}).href : '';
                    if (instancesUrl !== '') {
                        // we need to go get the instance data and recall this function to trigger rendering
                        this.loadData(parent, instancesUrl);
                    } else {
                        createElement(this.ol);
                        this.render(parent, data);
                    }
                });
        }

        /**
         * create a child within the tree view
         * @param {HTMLElement} parent, append to this.
         * @param {string} tagName, the html tag to create.
         * @param {object} item, schema object.
         * @returns {HTMLElement} the newly created list item.
         */
        createChild(parent, tagName, item) {
            const label = item.label || item.title || 'undefined';
            const rel = (item.rel || '').toLowerCase().replace(/(describedby|described_by):/gi, '');

            // get a list of attributes to be added to the element
            const attributes = Object.keys(item).reduce((attributeList, key) => {
                const list = attributeList;
                if (Object.prototype.hasOwnProperty.call(item, key) && key !== 'label' && key !== 'title' && key !== 'rel') {
                    list[`data-${key}`] = item[key] || '';
                }
                return list;
            }, {});

            if (rel !== '') {
                attributes.rel = rel;
            }

            const listItem = createElement(parent, tagName, attributes);

            createElement(listItem, 'span', null, label);

            return listItem;
        }

        /**
         * Render the TreeView based on an element and data.
         * @param {HTMLElement} parent, starting point of tree view render.
         * @param {object} data that builds the tree view.
         * @returns {undefined} renders the component but doesn't return.
         */
        render(parent, data) {
            let parentElement = parent || this.ol;
            const componentData = data || this.data;

            if (this.root !== '') {
                const li = this.createChild(parentElement, 'li', { label: this.root, rel: 'root' });
                parentElement = createElement(li, 'ol');
            }

            if (componentData.links) {
                for (let i = 0, l = componentData.links.length; i < l; i++) {
                    this.createChild(parentElement, 'li', componentData.links[i]);
                }
            }

            // TODO: use events instead of this or something neater.
            if (this.onrendercomplete) {
                this.onrendercomplete();
            }
        }

        /**
         * Event handler for component.
         * @param {event} e, event object from action.
         * @return {undefined} no returned value.
         */
        eventDelegate(e = event) {
            let el = e.target || e.srcElement;

            // resolve to LI
            el = (el.tagName !== 'LI') ? parentByAttribute(el, 'tagName', 'LI') : el;

            const dataSrc = el.getAttribute('data-href') || '';
            const rel = el.getAttribute('rel') || '';

            // ignore root clicks
            if (rel === 'root') {
                cancelEvent(e);
                return;
            }

            if (dataSrc !== '') {
                cancelEvent(e);

                // clear previous selection
                if (this.selected) {
                    this.selected.removeAttribute('data-selected');
                }

                // select new
                el.setAttribute('data-selected', 'true');

                this.selected = el;

                if (this.onclick) {
                    const txtProp = ('textContent' in document.createElement('i')) ? 'textContent' : 'innerText';
                    const relation = el.getAttribute('rel') || '';
                    const title = el[txtProp] || '';

                    this.onclick.call(el, dataSrc, title, relation);
                }
            }
        }

        /**
         * onrendercomplete blank function, it exists so other can hook into this.
         * TODO: Kill this ASAP.
         * @returns {undefined} undefined
         */
        onrendercomplete() {
        }
    }

    document.registerElement('ca-treeview', TreeView);
});
