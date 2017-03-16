/* global SystemJS */
SystemJS.config({
    map: {
        'document-register-element': '/bower_components/document-register-element/build/document-register-element.amd.js',
        'intl-api': 'helpers/intl-api.js',
        pikaday: '/bower_components/pikaday/pikaday.js'
    },
    baseURL: '/components'
});
