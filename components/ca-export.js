// <reference path="../js/helpers.js" />
// <reference path="../js/component-support.js" />

(function(base, document, helpers, componentSupport)
{
    /**
     * @exports ca-export
     * @description A custom HTML element (Web Component) that can be created using 
     * document.createElement('ca-export') or included in a HTML page as an element. 
     */
    var componentName = 'ca-export',
        txtProp = ('textContent' in document.createElement('i')) ? 'textContent' : 'innerText';

    // Create a prototype for our new element that extends HTMLElement
    var proto = Object.create(base, {
        /** @property {string} ca-export.src - the url of the json schema */
        src: {
            get: function() {
                return this.getAttribute('src') || '';
            },
            set: function(src) {

                src = src || '';

                var self = this;

                if (src !==''){

                    componentSupport.request({url: src, dataType:'json'}).then(function(res){

                        if (res){

                            // store data
                            self.data = res.list || [];

                            // get the schema link
                            var schemaUrl = ((res.links || []).where('rel','describedby', true) || {}).href || '';

                            // go get the schema to we know how to layout the export
                            return componentSupport.request({url: schemaUrl, dataType:'json'})
                        }
                    })
                    .then(function(schema){
                        self.schema = schema;
                    });
                }

                self.setAttribute('src', src);
            }
        },
        /** @property {boolean} ca-export.showRecordCount - flag to determine whether to show the record count or not */
        showRecordCount:{
            get: function() {
                return (this._showRecordCount === true);
            },
            set: function(value) {
                this._showRecordCount = (value === true);
            }
        },
        /** @property {string} ca-export.label - the text to go on the export button */
        label: {
            get: function() {
                return this.getAttribute('label');
            },
            set: function(value) {
                this.setAttribute('label', value);
            }
        },
        /** @property {string} ca-export.filename - the name of the file to export */
        filename: {
            get: function() {
                return this.getAttribute('filename');
            },
            set: function(value) {
                this.setAttribute('filename', value);
            }
        },
        /** @property {string} ca-export.schema - the url that points to the JSON schema */
        schema: {
            get: function(){
                return this._schema;
            },
            set: function(value){
                this._schema = value || {};
            }
        },
        /** @property {object} ca-export.data -  */
        data: {
            get: function(){
                return this._data || [];
            },
            set: function(value){
                this._data = value;

                if (this._data && this._data.length>0){
                    this.hasData = true;
                }
                else {
                    this.hasData = false;
                }

                if (this.showRecordCount){
                    this.button[txtProp] += ' (' + (this.data||[]).length + ' records)';
                }
            }
        },
        /** @property {boolean} ca-export.hasData - flag to indicate whether there is any data to export */
        hasData: {
            get: function() {
                return this.getAttribute('has-data');
            },
            set: function(value) {
                this.setAttribute('has-data', value==true);
            }
        },
        /** @property {string} ca-export.type - the type of file to export */
        type: {
            get: function() {
                return this.getAttribute('type') || 'csv';
            },
            set: function(value) {

                // ensure its always csv or xls
                value = (value != 'xlsx') ? value = 'csv' : 'xlsx';

                this.setAttribute('type', value);
            }
        },
        /** @property {string} ca-export.templateConversionUrl - end point that creates excel file from headers - only required for type=xls */
        templateConversionUrl:{
            get: function() {
                return this.getAttribute('template-conversion-url') || '/excel-download';
            },
            set: function(value) {

                value = value || '/excel-download';

                this.setAttribute('template-conversion-url', value);
                this.form.action = value;
            }
        }
    });

    /**
     * @description Executes when the element is first created
     * @access private
     * @type {Event}
     * @this {ca-export} - current instance of ca-export
     */
    proto.createdCallback = function() {

        var self = this;

        self.showRecordCount = true;

        // insert download button
        self.button = helpers.createEl(self, 'a', {'class':'ca-export-button', 'href':'#', 'target':'_blank', 'download': self.filename}, self.label || '');
        self.button.onclick = self.downloadHandler.bind(self);
    };

    /**
     * @description Executes when any attribute is changed on the element
     * @access private
     * @type   {Event}
     * @this   {ca-export} - current instance of ca-export
     * @param  {string} attrName - the name of the attribute to have changed
     * @param  {string} oldVal - the old value of the attribute
     * @param  {string} newVal - the new value of the attribute
     */
    proto.attributeChangedCallback = function(attrName, oldVal, newVal){

        switch (attrName){
            case 'label':{
                this.button[txtProp] = this.label;
            } break;

            case 'filename':{
                this.button.setAttribute('download', this.filename);
            } break;
        }
    }

    /**
     * Called before download, returning false cancels the download
     */
    proto.onbeforedownload = function(){

    };

    /**
     * @description Fires once the download has completed (it's all local);
     * @access private
     * @type {Event}
     * @this {ca-export} - current instance of ca-export
     */
    proto.ondownloadcomplete = function(){

    };

    /**
     * @description Executes when the user clicks the download button
     * @access private
     * @type {Event}
     * @this {ca-export} - current instance of ca-export
     */
    proto.downloadHandler = function(e){
        e = e || event;
        var self = this,
            el = e.target || e.srcElement;

        // if onbeforedownload is not a function or if that handler returns anything other than false
        if (!self.onbeforedownload || self.onbeforedownload()!==false){

            switch (self.type){

                case "csv":{

                    // convert the data into CSV content
                    var data = helpers.jsonToCSV(self.schema, self.data);

                    // trigger the download using a datauri (encoding content)
                    el.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data);

                } break;

                case "xlsx":{

                    helpers.cancelEvent(e);

                    var schema = (self.schema || {}).properties || {},  // get schema keys
                        keys = [],                                      // actual schema object keys
                        headers = [],                                   // headers to use in excel file
                        data = (self.data.length>0) ? self.data : [{}], // ensure we always have at least 1 item (so we can download just the headers)
                        rows = [];                                      // rows of data

                    // get keys we're interested in
                    Object.keys(schema).forEach(function(key){
                        if (schema.hasOwnProperty(key) && key !== 'links'){
                            keys.push(key);
                        }
                    });

                    // build headers (use .title if present, otherwise the schema key)
                    keys.forEach(function(key){
                        headers.push(schema[key].title || key);
                    });

                    if (headers.length > 0) {

                        // go through each data item and create new objects using headers as keys
                        for (var i=0, l=data.length; i<l; i++){
                            var item = {};

                            for (var ii=0,ll=keys.length; ii<ll; ii++){
                                item[headers[ii]] = data[i][keys[ii]] || '';
                            }

                            rows.push(item);
                        }

                        // post to server via iframe, server will convert to excel and trigger a download
                        helpers.postViaIframe(self.templateConversionUrl, {
                            json: JSON.stringify(rows)
                        });
                    }

                } break;

            }

            // execute download complete, fire external event handler
            if (this.ondownloadcomplete) this.ondownloadcomplete();
        }
        else {
            // if onbeforedownload returned false, cancel the event
            helpers.cancelEvent(e);
        }
    };

    // Register our new element
    document.registerElement(componentName, { prototype: proto });

})(HTMLElement.prototype, document, helpers, componentSupport);