define([
    './helpers/component-support.js',
    './helpers/create-element.js',
    './helpers/cancel-event.js',
    './helpers/clear-element.js',
    './helpers/clone-object.js',
    './helpers/schema-to-default.js',
    './helpers/parent-by-attribute.js',
    './helpers/dialogs.js',
    'document-register-element'
], (componentSupport, createElement, cancelEvent, clearElement, cloneObject, schemaToDefault, dialogs, getParentByAttribute, keyboard) => {

    const isValid = {
        _id(e) {
            // a valid key code for an Id is A-Z or 0-9 or the standard 'navigation' keys
            // eslint-disable-next-line new-cap
            return ((keyboard.AtoZ(e)) || (keyboard.ZEROtoNINE(e)) || keyboard.navKeys(e));
        },
        fieldName(e) {
            // determine the type and source of the event
            const eType = e.type.toLowerCase();
            const eSrc = e.target || e.srcElement;

            // if we are pressing a keydown on the fieldName field
            if ((eType === 'keydown') && (eSrc.id === 'fieldName')) {
                // return whether the keycode is valid for an id field
                return this._id(e);
            }

            // reached here so everything valid
            return true;
        }
    };

    const eventActions = {
        // <Toolbox> methods
        toolboxAction(el, src) {
            const tagName = src.tagName;

            // determine whether you clicked on a tool box item ('A') or the add tool to form button ('BUTTON')
            if (tagName === 'A') {
                // set the source element as the selected tool
                this.setSelectedTool.call(this, src);
            } else if (tagName === 'BUTTON') {
                // determine which tool has been selected
                const selectedTool = this.getSelectedTool.call(this);

                // if there is a selected tool
                if (selectedTool.tool) {
                    // create a new schema by cloning the selected tool from the form builder grand schema
                    const newSchema = cloneObject(this.schemaToolbox.where('id', selectedTool.schemaType, true));

                    // need to show the property form in the property area
                    this.propertyFormShow.call(this);

                    // create a new form in the property area based on the new schema
                    this.propertyFormCreate.call(this, newSchema);

                    // populate the form fields in the property area
                    this.propertyFormPopulate.call(this, newSchema);
                }
            }
        },
        // </Toolbox> methods

        // <Preview> methods
        previewAction(el, src) { // eslint-disable-line consistent-return
            // try to get hold of the label that is the parent of the clicked on element
            const lbl = getParentByAttribute(src, 'tagName', 'LABEL');

            if (lbl) {
                // only "click" this element if the data-selected attribute is not already selected
                if (lbl.getAttribute('data-selected') !== 'true') {
                    // determine the data-key associated with the clicked on label
                    const dataKey = lbl.getAttribute('data-key') || '';

                    // click on this element using the data key of the clicked on label
                    this.clickThisElement.call(this, dataKey);

                    // need to show the property form in the property area
                    this.propertyFormShow.call(this);

                    // return false to prevent the event bubbling up to any other object in the preview form
                    return false;
                }
            } else {
                // user must have clicked somewhere else on the preview form
                this.clearSelectedElement.call(this);

                // select the form
                this.previewForm.form.setAttribute('data-selected', true);

                // need to show the meta data form in the property area
                this.metadataFormShow.call(this);
            }
        },
        // </Preview> methods

        // <PreviewButton> methods
        clearFormClick(el, src) {
            const self = this;

            // if the form has been modified then ask if you want to save before clearing
            if (this.modified) {
                // if clear form dialog not already open
                if (self.clearFormDialogOpen !== true) {
                    // set flag to say clear form dialog is now open
                    self.clearFormDialogOpen = true;

                    dialogs.confirm('Do you want to save the modified file?', 'Clear Form', function(callback) {
                        // closing dialog so reset flag to say clear form dialog is not open
                        self.clearFormDialogOpen = false;

                        if (callback === 'Yes') {
                            // save the form and clear the form
                            this.saveForm.call(self).then(
                                function() {
                                    // save was successful so now clear the form
                                    this.clearForm.call(self);
                                },
                                () => {
                                    // the save failed so log the error and don't clear the form
                                    dialogs.alert('Failed to save the form!', 'Clear Form', null, () => {}, 'dialog-clear-form');
                                }
                            );
                        } else if (callback === 'No') {
                            // just clear the form
                            this.clearForm.call(self);
                        }
                    }, 'dialog-clear-form');
                }
            } else {
                // otherwise just clear the form
                this.clearForm.call(self);
            }
        },
        loadFormClick(el, src) {
            const self = this;

            // if the form has been modified then ask if you want to save before loading a new one
            if (this.modified) {
                // if load form dialog not already open
                if (self.loadFormDialogOpen !== true) {
                    // set flag to say load form dialog is now open
                    self.loadFormDialogOpen = true;

                    dialogs.confirm('Do you want to save the modified file?', 'Load Form', function(callback) {
                        // closing dialog so reset flag to say load form dialog is not open
                        self.loadFormDialogOpen = false;

                        if (callback === 'Yes') {
                            // save the form and load the form
                            this.saveForm.call(self).then(
                                function() {
                                    // save was successful so now load the new form
                                    this.loadForm.call(self);
                                },
                                () => {
                                    // the save failed so log the error and don't load the new form
                                    dialogs.alert('Failed to save the form!', 'Save Form', null, () => {}, 'dialog-save-form-success');
                                }
                            );
                        } else if (callback === 'No') {
                            // just load the form
                            this.loadForm.call(self);
                        }
                    }, 'dialog-load-form');
                }
            } else {
                // otherwise just load the form
                this.loadForm.call(self);
            }
        },
        saveFormClick(el, src) {
            const self = this;

            // if the form has been modified then save the form
            if (this.modified) {
                this.saveForm.call(self);
            } else {
                dialogs.alert('The form has not been modified', 'Save Form', ['Ok'], () => {}, 'dialog-save-form');
            }
        },
        logFormClick(el, src) {
            const postData = {
                meta: {
                    data: this.metadataForm.getData(),
                    schema: this.metadataForm.schema[0],
                    links: this.schema[0].links
                },
                form: {
                    data: this.previewForm.getData(),
                    schema: this.previewForm.schema[0]
                }
            };

            postData.meta.data.formDefinition = this.previewForm.schema[0];

            console.log('Data = %o', postData);
        },
        // </PreviewButton> methods

        // <Property> methods
        propertyAction(el, src, e) {
            // do not do anything if there is no property form
            if (!this.propertyForm) {
                return;
            }

            // if the key pressed in the field name is not valid
            if (isValid.fieldName(e) === false) {
                // then cancel the event and don't let it bubble
                cancelEvent(e);
                return;
            }

            // get hold of the schemas in the property and preview forms
            const propertyFormSchema = this.propertyForm.schema[0];
            const previewFormSchema = this.previewForm.schema[0];

            // get the data from the fields in the property form
            const propertyFormData = this.propertyForm.getData();

            // generate the urn from the property form
            const urn = this.urnToJson(propertyFormSchema.id, {
                fieldName: propertyFormData.fieldName,
                sequence: propertyFormData.sequence
            });

            // calculate the old and new data keys to check if the field name has changed
            const dataKeyOld = this.getSelectedElement.call(this).dataKey;
            const dataKeyNew = urn.dataKey;

            // if the data keys have changed
            if (dataKeyOld !== dataKeyNew) {
                // remove the properties associated with the old data key
                delete previewFormSchema.properties[dataKeyOld];

                // update the property form id to match the urn of the new field name
                propertyFormData.id = urn.id;

                // set the id on the property form
                this.propertyForm.populate({
                    id: urn.id
                });
            }

            // add the properties associated with the new field id
            previewFormSchema.properties[dataKeyNew] = propertyFormData;

            // re-render the preview form
            this.previewForm.render();

            // select the element using the new data key
            this.setSelectedElement.call(this, dataKeyNew);
        },
        propertyMoveUp(el, src) {
            // get hold of the selected element in the preview form and the previous element
            const elSource = this.getSelectedElement.call(this);
            const elDestination = this.getPreviousElement.call(this, elSource);

            // swap over the source and destination elements
            this.fieldSwap.call(this, elSource, elDestination);
        },
        propertyMoveDown(el, src) {
            // get hold of the selected element in the preview form and the next element
            const elSource = this.getSelectedElement.call(this);
            const elDestination = this.getNextElement.call(this, elSource);

            // swap over the source and destination elements
            this.fieldSwap.call(this, elSource, elDestination);
        },
        propertyClone(el, src) {
            // get hold of the selected element
            const selectedElement = this.getSelectedElement.call(this);

            // if there is a selected element
            if (selectedElement.element) {
                // get hold of the schema on the preview form
                const previewFormSchema = this.previewForm.schema[0];

                // get hold of the schema for the selected element
                const props = previewFormSchema.properties[selectedElement.dataKey];

                // if the properties exists in the schema of the preview form
                if (props) {
                    // generate the urn for this new schema (adding one to the sequence for the new element)
                    const urn = this.urnToJson(props.id, {
                        sequence: (props.sequence * 1) + 1
                    });

                    // create a new instance of the schema
                    const newProps = cloneObject(props);

                    // set the base properties on the new schema instance
                    newProps.id = urn.id;
                    newProps.sequence = urn.sequence;

                    // insert the new schema instance into the properties collection using the dataKey
                    previewFormSchema.properties[urn.dataKey] = newProps;

                    // re-index the data keys on the preview form (backwards indexing - ie from end to start to create a gap for the cloned element)
                    this.fieldReIndex.call(this, this.previewForm.schema[0], -1);

                    // get the next element after the originally selected element
                    const thisElement = this.getThisElement.call(this, selectedElement.dataKey);
                    const nextElement = this.getNextElement.call(this, thisElement);

                    // try to click on the next element but if we couldn't
                    if (this.clickThisElement.call(this, nextElement.dataKey) === false) {
                        // then clear all elements from the property area
                        this.propertyFormClear.call(this);
                    }
                }
            }

            return false;
        },
        propertyRemove(el, src) {
            const self = this;

            // if property remove dialog not already open
            if (self.propertyRemoveDialogOpen !== true) {
                // set flag to say property remove dialog is now open
                self.propertyRemoveDialogOpen = true;

                dialogs.confirm('Are you sure you want to remove this field from the form?', 'Remove Property', function(callback) {
                    // closing dialog so reset flag to say property remove dialog is not open
                    self.propertyRemoveDialogOpen = false;

                    if (callback === 'Yes') {
                        // get hold of the selected element
                        const selectedElement = this.getSelectedElement.call(self);

                        // if there is a selected element
                        if (selectedElement.element) {
                            // get hold of the schema on the preview form
                            const previewFormSchema = self.previewForm.schema[0];

                            // if the properties exists in the schema of the preview form
                            if (previewFormSchema.properties[selectedElement.dataKey]) {
                                // remove the properties associated with the data key of the selected element
                                delete previewFormSchema.properties[selectedElement.dataKey];

                                // re-index the data keys on the preview form (forwards indexing - ie from start to end to plug the gap)
                                this.fieldReIndex.call(self, self.previewForm.schema[0], +1);

                                // re-select using the dataKey of the selected element
                                const thisElement = this.getThisElement.call(self, selectedElement.dataKey);

                                // try to click on this element but if we couldn't
                                if (this.clickThisElement.call(self, thisElement.dataKey) === false) {
                                    // click the first element on the page
                                    this.clickFirstElement.call(self);
                                }
                            }
                        }
                        // return false;
                    }
                }, 'dialog-property-remove');
            }
        },
        // </Property> methods

        // <MetaData> methods
        metadataAction(el, src, e) {
            switch (src.id) {
                case 'title':
                    // set the form name
                    this.previewForm.schema[0][src.id] = src.value;
                    this.previewForm.render();
                    break;

                case 'description':
                    // set the form description
                    this.previewForm.schema[0][src.id] = src.value;
                    this.previewForm.render();
                    break;

                case 'columns':
                    // set the number of columns in the form
                    this.previewForm.columns = parseInt(src.value, 10) || 1;
                    this.previewForm.render();
                    break;

                default: break;
            }
        }
        // </MetaData> methods
    };

    /**
     * @exports ca-form-builder
     * @description A custom HTML element (Web Component) that can be created using
     * document.createElement('ca-form-builder') or included in a HTML page as an element.
     */
    class FormBuilder extends HTMLElement {

        /**
         * Executes when the element is first created
         * @returns {undefined} nothing
         */
        createdCallback() {}

        /**
         * Executes when the element is attached to the DOM
         * @returns {undefined} nothing
         */
        attachedCallback() {
            // only keep the api if running in "reflection" mode
            this.loadAllSchemas.call(this);

            // use our own eventDelegate to handle all click and keyup events on the ca form builder
            document.onclick = this.eventDelegate.bind(this);
            document.onkeyup = this.eventDelegate.bind(this);
            document.onkeydown = this.eventDelegate.bind(this);
        }

        /**
         * Executes when any attribute is changed on the element
         * @param {string} attrName - the name of the attribute to have changed
         * @param {string} oldVal - the old value of the attribute
         * @param {string} newVal - the new value of the attribute
         * @returns {undefined} nothing.
         */
        attributeChangedCallback(attrName, oldVal, newVal) {}

        /**
         * Gets actions
         * @returns {events} src
         */
        get EventActions() {
            return eventActions;
        }

        /**
         * Gets src
         * @returns {string} src
         */
        get src() {
            return this.getAttribute('src');
        }

        /**
         * Sets src url
         * @param {string} value, string url
         */
        set src(value) {
            this.setAttribute('src', value);
            this.loadSchema.call(this);
        }

        /**
         * Gets schema
         * @returns {string} src for toolbox
         */
        get srcToolbox() {
            return this.getAttribute('data-toolbox');
        }


        /**
         * Sets schema
         * @param {string} value src for toolbox
         */
        set srcToolbox(value) {
            this.setAttribute('data-toolbox', value);
            this.loadSchemaToolbox.call(this);
        }

        /**
         * Gets schema
         * @returns {object} schemas
         */
        get schema() {
            return this._schema;
        }

        /**
         * Sets the schema
         * @param {object} value, schema
         */
        set schema(value) {
            this._schema = value;
            this.render();
        }

        /**
         * Sets schemaToolbox - array of schemas for the tools
         * @param {object} schemas for the tools
         */
        get schemaToolbox() {
            return this._schemaToolbox;
        }

        /**
         * Sets schemaToolbox - array of schemas for the tools
         * @param {object} value, schema for the tools
         */
        set schemaToolbox(value) {
            this._schemaToolbox = value;
        }

        /**
         * Gets schema for the metadata
         * @returns {object}  schema for the metadata
         */
        get schemaMetaData() {
            return this._schemaMetaData;
        }


        /**
         * Sets schema for the metadata
         * @param {object} value, schema for the metadata
         */
        set schemaMetaData(value) {
            this._schemaMetaData = value;
        }

        /**
         * Gets modified
         * @returns {undefined} state about form.
         */
        get modified() {
            return this.formIsDirty.call(this);
        }

        /**
         * Renders the element
         * @returns {undefined} nothing, renders the element.
         */
        render() {
            // clear all elements from the form builder
            clearElement(this);

            // create a tool box for holding the tools
            this.toolbox = createElement(this, 'div', {
                class: 'ca-form-builder-toolbox',
                'data-action': 'toolboxAction'
            });

            // create a preview for holding the master form
            this.preview = createElement(this, 'div', {
                class: 'ca-form-builder-preview',
                'data-action': 'previewAction'
            });

            // create a property area
            this.property = createElement(this, 'div', {
                class: 'ca-form-builder-property',
                'data-action': 'propertyAction'
            });

            // create a meta data area (with the links stripped out) for holding the meta data form
            this.metadata = createElement(this, 'div', {
                class: 'ca-form-builder-metadata',
                'data-action': 'metadataAction'
            });
            this.metadataForm = createElement(this.metadata, 'ca-form', {
                schema: this.schemaNoLinks(this.schemaMetaData)
            });

            // add a form based on the schema (with the links stripped out) into the preview with validation disabled
            this.previewForm = createElement(this.preview, 'ca-form', {
                schema: this.schemaNoLinks(this.schema),
                disableValidation: 'true'
            });

            // create a container for the buttons underneath the preview form
            this.previewFormButtons = createElement(this.preview, 'div', {
                class: 'ca-form-builder-previewform-buttons'
            });

            createElement(this.previewFormButtons, 'button', {
                type: 'button',
                'data-action': 'saveFormClick',
                'data-trigger': 'click',
                class: 'right'
            }, 'Save Form');

            createElement(this.previewFormButtons, 'button', {
                type: 'button',
                'data-action': 'loadFormClick',
                'data-trigger': 'click',
                class: 'right'
            }, 'Load Form');

            createElement(this.previewFormButtons, 'button', {
                type: 'button',
                'data-action': 'clearFormClick',
                'data-trigger': 'click',
                class: 'right'
            }, 'Clear Form');

            createElement(this.previewFormButtons, 'button', {
                type: 'button',
                'data-action': 'logFormClick',
                'data-trigger': 'click'
            }, 'Log Form to Console');

            // create a container for the buttons in the toolbox
            this.toolboxButtons = createElement(this.toolbox, 'div', {
                class: 'ca-form-builder-toolbox-buttons'
            });

            // for each toolbox schema
            this.schemaToolbox.forEach(item => {
                // add an item to the tool box for the designated schema
                createElement(this.toolboxButtons, 'a', {
                    'data-schema-type': item.id
                }, item.title);
            });

            // add an add button underneath the tool box
            createElement(this.toolbox, 'button', {
                type: 'button',
                class: 'right'
            }, 'Add Tool To Form');

            // start off with the form element in the preview area selected
            this.clickFormElement.call(this);

            // show the meta data form
            this.metadataFormShow.call(this);
        }

        /**
         * Event Delegate function
         * @access private
         * @param {Event} e, event object from action.
         * @returns {boolean} true, always
         */
        eventDelegate(e = event) {
            let el = e.target || e.srcElement;
            const src = el;
            const tag = (el.tagName || '').toUpperCase();
            const eventType = e.type.toLowerCase();
            let action = null;
            let trigger = null;

            // allow links with targets set to open normally
            if (tag === 'A' && el.target === '_blank') {
                return;
            }

            while (el && el !== document.documentElement) {
                action = el.getAttribute('data-action');
                trigger = el.getAttribute('data-trigger');

                if (action) {
                    break;
                }
                el = el.parentNode;
            }

            // if the action has a function associated with it
            if (action && (typeof (eventActions[action]) === 'function')) {
                // and the action trigger matches (or no trigger has been specified)
                if (!trigger || trigger === eventType) {
                    // then invoke the method with this passed through as the instance of ca-form-builder
                    if (eventActions[action].call(this, el, src, e) === false) {
                        // if the method explicitly returns false then prevent the event from bubbling up
                        cancelEvent(e);
                    }
                }
            }
        }

        // Take a urn (eg "namespace:component:tool:fieldName:sequence") and break it into its constituent parts in a Json object
        urnToJson() {
            const result = {
                namespace: null,
                component: null,
                tool: null,
                fieldName: null,
                sequence: null
            };
            const validKeys = 'namespace:component:tool:fieldName:sequence';
            const parts = arguments[0].split(':'); // eslint-disable-line prefer-rest-params
            const overrides = arguments[1]; // eslint-disable-line prefer-rest-params

            // break the constituent parts into the separate fields
            result.namespace = parts[0];
            result.component = parts[1];
            result.tool = parts[2];

            if (parts.length === 5) {
                // if the caller has passed in all 5 parts of the urn
                result.fieldName = parts[3];
                result.sequence = parts[4];
            }

            // if there are any overrides specified
            if (overrides) {
                // get hold of the keys to the overrides
                const keys = Object.keys(overrides);
                keys.forEach((item) => {
                    // for each override key that is valid
                    if (validKeys.indexOf(item) > -1) {
                        result[item] = overrides[item];
                    }
                });
            }

            // set defaults if value not specified
            result.fieldName = result.fieldName || 'Untitled';
            result.sequence = result.sequence || '10';

            result.id = `${result.namespace}:${result.component}:${result.tool}:${result.fieldName}:${result.sequence}`;
            result.schema = `${result.namespace}:${result.component}:${result.tool}`;
            result.dataKey = `${result.fieldName}#${result.sequence}`;

            return result;
        }

       /**
        * Loads all schemas
        * @access private
        * @returns {undefined} loads all schemas
        */
        loadAllSchemas() {
            // if a toolbox url source exists
            if (this.srcToolbox) {
                // then load the toolbox schema (which internally loads the ca form builder schema when done)
                this.loadSchemaToolbox.call(this);
            } else {
                // load the ca form builder schema (and save the metadata)
                this.loadSchema.call(this, true);
            }
        }

        /**
         * Loads a schema
         * @access private
         * @param {boolean} saveMetaData, flag for saving meta data
         * @returns {undefined} loads a schema
         */
        loadSchema(saveMetaData) {
            return componentSupport.request({
                url: this.src,
                dataType: 'json'
            })
            .then(metadata => {
                // if specified
                if (saveMetaData) {
                    // save the meta data schema
                    this.schemaMetaData = metadata;
                }

                // clone the metadata schema but clear out the properties (to leave a blank form)
                const clone = cloneObject(metadata);
                clone[0].properties = {};

                // save the schema (which triggers a render)
                this.schema = clone;

                // take a snapshot of the current form state
                this.formTakeSnapshot.call(this);
            })
            .catch(err => {
                console.log('Form Builder schema not found!');
            });
        }

        /**
         * Loads schema toolback
         * @access private
         * @returns {undefined} loads schema toolbox
         */
        loadSchemaToolbox() {
            // load the toolbox schema
            componentSupport.request({
                url: this.srcToolbox,
                dataType: 'json'
            })
            .then(data => {
                // save the toolbox schema
                this.schemaToolbox = data;

                // load the form builder schema (and store the metadata)
                this.loadSchema.call(this, true);
            })
            .catch(err => {
                console.log('Form Builder toolbox schema not found!');
            });
        }

        schemaNoLinks(schema) {
            // if no schema passed in
            if (typeof schema === 'undefined') {
                // then schema with no links is null
                return null;
            }

            // Return a clone of the schema passed in with the links removed so the associated form doesn't have any buttons
            const retSchema = cloneObject(schema);
            delete retSchema[0].links;
            return retSchema;
        }

        // </schema> methods

        // <form> methods
        clearForm() {
            // simply load the initial schema (leave the metadata intact)
            this.loadSchema.call(this);

            // click the form element in the preview area
            this.clickFormElement.call(this);

            // and show the meta data form
            this.metadataFormShow.call(this);
        }

        loadForm() {
            // select the first 'links' where 'rel'='instances' in the schema
            const loadLink = this.schema[0].links && this.schema[0].links.where('rel', 'instances', true);

            if (loadLink) {
                // grab hold of the form id from the meta data
                const formId = this.metadataForm.getData().formId;

                // get the position of the last '/' in the loadLink url
                const idx = loadLink.href.lastIndexOf('/');

                // and place the formId at the end of the url (or a suitable default for now)
                loadLink.href = `${loadLink.href.substring(0, idx)}/${formId || '123'}`;

                componentSupport.request({
                    url: loadLink.href,
                    type: loadLink.method,
                    dataType: 'json',
                    contentType: 'application/json'
                })
                .then(data => {
                    // strip out the meta data and the schema from the json returned
                    this.schema = [data.formDefinition];

                    // get hold of the number of columns in the metadata and use this to render the form
                    this.previewForm.columns = data.columns || 1;
                    this.previewForm.render();

                    // place the links inside the schema
                    this.schema[0].links = data.links;

                    const metadata = data;
                    delete metadata.formDefinition;

                    // populate the meta data form with the values returned in the json
                    this.metadataForm.populate(metadata);

                    // take a snapshot of the current form state
                    this.formTakeSnapshot.call(this);
                })
                .catch(err => {
                    dialogs.alert('Failed to load the form!', 'Load Form', null, () => {}, 'dialog-load-form');
                });
            }
        }

        saveForm() {
            const metadata = this.metadataForm.getData();
            let saveData = null;

            // if a form id has not been specified
            if (typeof metadata.formId === 'undefined' || metadata.formId === '') {
                // then this is a CREATE so select the first 'links' where 'rel'='create' in the schema
                saveData = this.schema[0].links && this.schema[0].links.where('rel', 'create', true);
            } else {
                // this is an UPDATE so select the first 'links' where 'rel'='update' in the schema
                saveData = this.schema[0].links && this.schema[0].links.where('rel', 'update', true);
            }

            return new Promise((resolve, reject) => {
                if (saveData) {
                    saveData.json = metadata;
                    saveData.json.formDefinition = this.previewForm.schema[0];

                    componentSupport.request({
                        url: saveData.href,
                        type: saveData.method,
                        dataType: 'json',
                        data: saveData.json,
                        contentType: 'application/json'
                    })
                    .then(data => {
                        dialogs.alert('The form has been saved!', 'Save Form', null, () => {}, 'dialog-save-form-success');

                            // place the links inside the schema
                        this.schema[0].links = data.links;

                            // set the formId returned by the server
                        this.metadataForm.populate({
                            formId: data.formId
                        });

                            // now the form has saved, click on the form element
                        this.clickFormElement.call(this);

                            // and show the meta data form
                        this.metadataFormShow.call(this);

                            // take a snapshot of the current form state
                        this.formTakeSnapshot.call(this);

                            // resolve the Promise
                        resolve();
                    })
                    .catch(err => {
                          // reject the Promise
                        reject();

                        dialogs.alert('Failed to save the form!', 'Save Form', null, () => {}, 'dialog-save-form');
                    });
                } else {
                    // reject the promise as it was not possible to save the form
                    reject();
                }
            });
        }

        formTakeSnapshot() {
            // get hold of the current metadata
            const metadata = this.metadataForm.getData();

            // store the current metadata and schema
            this.formState = {
                formId: '',
                title: metadata.title,
                description: metadata.description,
                applicationName: metadata.applicationName,
                businessStreams: [metadata.businessStreams],
                validFrom: metadata.validFrom,
                validTo: metadata.validTo,
                columns: metadata.columns,
                formDefinition: cloneObject(this.previewForm.schema[0])
            };
        }

        formIsDirty() {
            // get hold of the current metadata
            const metadata = this.metadataForm.getData();

            // setup the current metadata and schema
            const current = {
                formId: '',
                title: metadata.title,
                description: metadata.description,
                applicationName: metadata.applicationName,
                businessStreams: [metadata.businessStreams],
                validFrom: metadata.validFrom,
                validTo: metadata.validTo,
                columns: metadata.columns,
                formDefinition: cloneObject(self.previewForm.schema[0])
            };

            // compare this to the previous version (if they are different, then the form is "dirty")
            return (JSON.stringify(current) !== JSON.stringify(this.formState));
        }

        // </form> methods

        // <toolbox> methods
        getSelectedTool() {
            const result = {
                tool: null,
                schemaType: ''
            };

            // determine which tool has been selected
            result.tool = this.toolbox.querySelector('a[data-selected="true"]');

            // if a data-selected element is found in the toolbox
            if (result.tool) {
                // then get the schema type for the selected element
                result.schemaType = result.tool.getAttribute('data-schema-type');
            }

            return result;
        }

        setSelectedTool(src) {
            // for each tool in the toolbox
            Array.prototype.slice.call(this.toolbox.querySelectorAll('a')).forEach((item) => {
                // unselect the item
                item.removeAttribute('data-selected');
            });

            // set the selected attribute on the source element
            src.setAttribute('data-selected', true);
        }

        // </toolbox> methods

        // <previewForm> Element methods
        getSelectedElement() {
            const result = {
                element: null,
                dataKey: ''
            };

            // find the element in the preview form where the data-selected attribute is set
            result.element = this.previewForm.querySelector('label[data-selected="true"]');

            // if a data-selected element is found in the preview form
            if (result.element) {
                // then get the data key for the selected element
                result.dataKey = result.element.getAttribute('data-key');
            }

            return result;
        }

        getAdjacentElement(elCurrent, offset) {
            const blank = {
                element: null,
                dataKey: ''
            };

            // if there is no current element passed in
            if (!elCurrent || !elCurrent.element) {
                // then how can we determine the adjacent element???
                return blank;
            }

            // get hold of all the elements in the preview form
            const elements = this.previewForm.querySelectorAll('label');

            // set the index of the element to compare against depending on whether we are looking at next/previous element
            const idxFirstLast = (offset < 0) ? 0 : elements.length - 1;

            // if we are already on the first/last element
            if (elCurrent.element === elements[idxFirstLast]) {
                // there is no previous/next element
                return blank;
            }

            // run through all the elements
            for (let i = 0, l = elements.length; i < l; i++) {
                // if this element is the same as the current element
                if (elCurrent.element.innerHTML === elements[i].innerHTML) {
                    // then return the next/previous element
                    return {
                        element: elements[i + offset],
                        dataKey: elements[i + offset].getAttribute('data-key')
                    };
                }
            }

            // next/previous element not found
            return blank;
        }

        getPreviousElement(elCurrent) {
            return this.getAdjacentElement.call(this, elCurrent, -1);
        }

        getNextElement(elCurrent) {
            return this.getAdjacentElement.call(this, elCurrent, +1);
        }

        getThisElement(dataKey) {
            const result = {
                element: null,
                dataKey: ''
            };

            // find the element in the preview form where the data-key matches the dataKey passed in
            result.element = this.previewForm.querySelector(`label[data-key="${dataKey}"]`);

            // if a data-selected element is found in the preview form
            if (result.element) {
                // then get the data key for the selected element
                result.dataKey = result.element.getAttribute('data-key');
            }

            return result;
        }

        clickFormElement() {
            // start off by un-selecting all elements on the preview form
            this.clearSelectedElement.call(this);

            // set the data-selected attribute on the form
            this.previewForm.form.setAttribute('data-selected', true);
        }

        setSelectedElement(dataKey) {
            // start off by un-selecting all elements on the preview form
            this.clearSelectedElement.call(this);

            // for each label in the preview form
            Array.prototype.slice.call(this.previewForm.querySelectorAll('label')).forEach((item) => {
                // if the data-key attribute matches
                if (item.getAttribute('data-key') === dataKey) {
                    // then select the item
                    item.setAttribute('data-selected', true);
                }
            });
        }

        clickFirstElement() {
            // get hold of the dataKey for the first element on the page (if there is one)
            const labels = this.previewForm.querySelectorAll('label')[0];

            if (labels) {
                const dataKey = labels.getAttribute('data-key');

                if (dataKey) {
                    // now click this element
                    this.clickThisElement.call(this, dataKey);
                }
            } else {
                // there are no labels on the page so click the form element instead
                this.clickFormElement.call(this);
            }
        }

        clickThisElement(dataKey) {
            // select the element by data-key
            this.setSelectedElement.call(this, dataKey);

            // get hold of the schema properties from the preview form for the selected element
            const schemaProp = this.previewForm.schema[0].properties[dataKey];

            // if the schema properties exist
            if (schemaProp) {
                // determine the schema based on the id of the schema properties
                const urnSchema = this.urnToJson(schemaProp.id).schema;

                // find the first matching item in the grand list of schemas
                const selectedSchema = this.schemaToolbox.filter((item) => item.id === urnSchema).first();

                // create a new instance of the selected schema
                const newSchema = cloneObject(selectedSchema);

                // create a new form in the property area based on the new schema
                this.propertyFormCreate.call(this, newSchema);

                // populate the fields in the property box
                this.propertyForm.populate(schemaProp);

                // return true to indicate we successfully clicked on this element
                return true;
            }

            // return false to indicate we could not click on this element
            return false;
        }

        clearSelectedElement() {
            // for each label in the preview form
            Array.prototype.slice.call(this.previewForm.querySelectorAll('label')).forEach((item) => {
                item.removeAttribute('data-selected');
            });

            // also remove the data-selected attribute on the main form
            this.previewForm.form.removeAttribute('data-selected');
        }

        // </previewForm> Element methods

        // <propertyForm> methods
        propertyFormClear() {
            // clear all elements from the property area
            clearElement(this.property);

            // release the form
            this.propertyForm = null;
        }

        propertyFormCreate(schema) {
            // clear all elements from the property area
            this.propertyFormClear.call(this);

            // add a form to the property area based on the schema passed in
            this.propertyForm = createElement(this.property, 'ca-form', {
                schema: [schema]
            });

            // add buttons directly underneath the property area (all triggered by 'click')
            createElement(this.property, 'button', {
                type: 'button',
                'data-action': 'propertyMoveUp',
                'data-trigger': 'click'
            }, 'Move Up');
            createElement(this.property, 'button', {
                type: 'button',
                'data-action': 'propertyMoveDown',
                'data-trigger': 'click'
            }, 'Move Down');

            createElement(this.property, 'button', {
                type: 'button',
                'data-action': 'propertyRemove',
                'data-trigger': 'click',
                class: 'right'
            }, 'Remove');
            createElement(this.property, 'button', {
                type: 'button',
                'data-action': 'propertyClone',
                'data-trigger': 'click',
                class: 'right'
            }, 'Clone');
        }

        propertyFormPopulate(schema) {
            // get hold of the master schema in the preview area
            const previewFormSchema = this.previewForm.schema[0];

            // generate the next sequence number (based on the number of properties already in the schema)
            const sequence = ((Object.keys(previewFormSchema.properties).length) + 1) * 10;

            // create a new instance of the schema
            const schemaInstance = schemaToDefault(schema);

            // generate the urn for this new schema
            const urn = this.urnToJson(schema.id, {
                sequence,
                fieldName: schemaInstance.fieldName
            });

            // set the base properties on the new schema instance
            schemaInstance.title = schema.title;
            schemaInstance.description = schema.description;

            // run through the properties looking for default values to use
            const keys = Object.keys(schema.properties);
            keys.forEach((key) => {
                if (typeof schema.properties[key].default !== 'undefined') {
                    schemaInstance[key] = schema.properties[key].default;
                }
            });

            // now set the calculated properties (honour the fieldName if specified)
            schemaInstance.id = urn.id;
            schemaInstance.sequence = urn.sequence;
            schemaInstance.fieldName = schemaInstance.fieldName || urn.fieldName;

            // insert the new schema instance into the properties collection using the dataKey
            previewFormSchema.properties[urn.dataKey] = schemaInstance;

            // put the modified schema back into the preview form (setting schema triggers a re-render)
            this.previewForm.schema = [previewFormSchema];

            // populate the fields in the properties area with the values in this new schema instance
            this.propertyForm.populate(schemaInstance);

            // click the element with the specified dataKey
            this.clickThisElement.call(this, urn.dataKey);
        }

        propertyFormShow() {
            // need to show the property form in the property area
            this.property.setAttribute('data-selected', true);
            this.metadata.removeAttribute('data-selected', false);
        }

        // </propertyForm> methods

        // <metadataForm> methods
        metadataFormShow() {
            // click the form element itself
            this.clickFormElement.call(this);

            // need to show the metadata form in the property area
            this.property.removeAttribute('data-selected', false);
            this.metadata.setAttribute('data-selected', true);
        }

        // </metadataForm> methods

        // <field methods>
        fieldSwap(elSource, elDestination) {
            const source = {};
            const destination = {};

            // both source and destination elements must exist in order to swap them over
            if (elSource && elDestination && elSource.element && elDestination.element) {
                // get hold of the schema on the preview form
                const previewFormSchema = this.previewForm.schema[0];

                // get hold of the source and destination data keys
                source.dataKey = elSource.element.getAttribute('data-key');
                destination.dataKey = elDestination.element.getAttribute('data-key');

                // get hold of the source and destination properties
                source.props = previewFormSchema.properties[source.dataKey];
                destination.props = previewFormSchema.properties[destination.dataKey];

                // both source and destination properties must be available in order to swap
                if (source.props && destination.props) {
                    // get hold of the initial source and destination sequence values
                    source.sequence = this.urnToJson(source.props.id).sequence;
                    destination.sequence = this.urnToJson(destination.props.id).sequence;

                    // switch over the sequences (so source takes destination sequence and destination takes source sequence)
                    source.urn = this.urnToJson(source.props.id, {
                        sequence: destination.sequence
                    });
                    destination.urn = this.urnToJson(destination.props.id, {
                        sequence: source.sequence
                    });

                    // keys have changed so need to set the new id and sequence on the properties
                    source.props.id = source.urn.id;
                    source.props.sequence = source.urn.sequence;
                    destination.props.id = destination.urn.id;
                    destination.props.sequence = destination.urn.sequence;

                    // remove the property linked by the original data keys
                    delete previewFormSchema.properties[source.dataKey];
                    delete previewFormSchema.properties[destination.dataKey];

                    // and add the new properties back in keyed by the new data keys
                    previewFormSchema.properties[source.urn.dataKey] = source.props;
                    previewFormSchema.properties[destination.urn.dataKey] = destination.props;

                    // populate the fields in the property box
                    this.propertyForm.populate(source.props);

                    // re-render the preview form
                    this.previewForm.render();

                    // re-select the originally selected element
                    this.setSelectedElement.call(this, source.urn.dataKey);
                }
            }
        }

        fieldReIndex(schema, direction) {
            // render the form before re-indexing the data keys to make sure the labels are up to date
            this.previewForm.render();

            // get hold of all the elements in the preview form
            const elements = this.previewForm.querySelectorAll('label');

            // initialise the starting index (based on the number of elements on the form and the direction in which we are re-indexing)
            let index = (direction === 1) ? 0 : (elements.length * 10);
            const start = (direction === 1) ? 0 : (elements.length - 1);
            const finish = (direction === 1) ? (elements.length) : -1;

            // run through the elements from start to finish
            for (let i = start; i !== finish; i += direction) {
                // increase index if forward indexing
                index += ((direction === 1) ? 10 : 0);

                // get hold of the ith element in the list
                const item = elements[i];

                // get hold of the data key attribute for this control
                const key = item.getAttribute('data-key');

                // grab hold of the properties for this key
                const props = schema.properties[key];

                if (props) {
                    // convert the property id to a json (urn) object for easy manipulation and override the sequence
                    const urn = this.urnToJson(props.id, {
                        sequence: index
                    });

                    // only need to manipulate the properties if the keys have changed
                    if (key !== urn.dataKey) {
                        // keys have changed so need to set the new id and sequence on the properties
                        props.id = urn.id;
                        props.sequence = urn.sequence;

                        // now remove the property linked by the original key
                        delete schema.properties[key]; // eslint-disable-line no-param-reassign

                        // and add the new properties back in keyed by the new dataKey
                        schema.properties[urn.dataKey] = props; // eslint-disable-line no-param-reassign
                    }

                    // decrease index if backward indexing
                    index -= ((direction === -1) ? 10 : 0);
                }
            }

            // re-render the form having re-indexed the data keys
            this.previewForm.render();
        }

    }

    // Register our new element
    document.registerElement('ca-form-builder', FormBuilder);
});
