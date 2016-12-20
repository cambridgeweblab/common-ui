define('secure-ajax', ['./create-element.js', './secureajax.js'], (createElement, ajax) => {
    const componentSupport = {
        countryData: null,
        currentUser: null,
        currencies: null,
        iddPrefixes: [],

        // TODO: remove this and update all web components to use ajax.execute (can be passed as dependency)
        request: ajax.execute,

        init(req) {
            // if present, override .request with param passed to init
            componentSupport.request = req || componentSupport.request;

            // get country data from html attribute
            const countriesUrl = root.getAttribute('data-countries-url') || '';

            if (countriesUrl !== '') {
                ajax.execute({ url: countriesUrl, dataType: 'json' })
                    .then(data => {
                        componentSupport.countryData = data;
                    });
            }

            // get country data from html attribute
            const feedbackSchemaUrl = root.getAttribute('data-feedback-schema-url') || '';

            if (feedbackSchemaUrl !== '') {
                setTimeout(() => {
                    createElement(document.body, 'ca-feedback', {
                        dialogTitle: 'Feedback',
                        tip: 'Give us your feedback',
                        description: "We'd love to know what you think! Your feedback (good & bad) will help us improve the application.",
                        src: feedbackSchemaUrl
                    });
                }, 2000);
            }
        },

        getCurrencyMap() {
            if (!componentSupport.currencies && componentSupport.countryData) {
                componentSupport.currencies = {};
                componentSupport.countryData.forEach(country => {
                    componentSupport.currencies[country.iso] = country.currency;
                });
            }
            return componentSupport.currencies;
        },

        getUserLanguage() {
            // TODO FIX... or delete. This function is way too complicated.
            // TODO read the user language from the server 'me' record, provide a switcher client side.
            const userCountry = componentSupport.currentUser &&
                componentSupport.currentUser.properties.country &&
                componentSupport.countryData &&
                componentSupport.countryData.find(country => country.iso === componentSupport.currentUser.properties.country);
            let language = ((userCountry && userCountry.languages && userCountry.languages[0]) || (navigator.languages && (navigator.languages[0] || navigator.language)));
            if (userCountry) {
                if (language.indexOf('-') >= 0) {
                    language = language.substring(0, language.indexOf('-'));
                }
                language += `-${userCountry.iso}`;
            }
            return language;
        },

        getUserCurrency() {
            const userCountryCode = componentSupport.currentUser && (componentSupport.currentUser.properties.country || 'GB');
            const currencyMap = (componentSupport.getCurrencyMap() || {})[userCountryCode];
            // eslint-disable-next-line no-restricted-syntax
            for (const code in currencyMap) {
                if (Object.prototype.hasOwnProperty.call(currencyMap, code)) {
                    // Once only...
                    return {
                        code,
                        symbol: currencyMap[code].symbol
                    };
                }
            }
            return { code: 'XXX', symbol: 'XXX' }; // ISO standard for no currency.
        },

        /**
         * Go through schema properties resolving JSON pointers to external schemas (inlining external schema definitions)
         * @param {object} schema - schema to be parsed
         * @returns {promise} resolved state of schema
         */
        resolveExternalSchemaDefinitions(schema) {
            // get the properties section
            const properties = schema.properties;

            return new Promise((resolve, reject) => {
                const promises = [];

                // build an array of promises for each $ref
                // eslint-disable-next-line no-restricted-syntax
                for (const key in properties) {
                    if (Object.prototype.hasOwnProperty.call(properties, key)) {
                        const prop = properties[key];

                        if (prop.items &&
                            prop.items.extends &&
                            prop.items.extends[0] &&
                            prop.items.extends[0].$ref) {

                            promises.push(ajax.execute({ url: prop.items.extends[0].$ref, dataType: 'json' }));
                        }
                    }
                }

                if (promises.length > 0) {

                    // fetch each external schema definition and inline them
                    Promise.all(promises).then(results => {

                        // 1. find matching ref
                        // 2. replace extends ref with actual schema

                        results.forEach(item => {
                            // eslint-disable-next-line no-restricted-syntax
                            for (const key in properties) {
                                if (Object.prototype.hasOwnProperty.call(properties, key)) {
                                    const prop = properties[key];

                                    if (prop.items &&
                                        prop.items.extends &&
                                        prop.items.extends[0] &&
                                        prop.items.extends[0].$ref === item.id) {

                                        // replace extends ref with actual schema
                                        prop.items.extends[0] = item;
                                    }
                                }
                            }
                        });

                        resolve(schema);
                    })
                    .catch(err => {
                        reject(err);
                    });
                } else {
                    // no $ref to process, so just resolve
                    resolve(schema);
                }
            });
        },

        /**
         * Returns a list of international dialing codes to be consumsed by ca-tel components
         * @returns {array} sorted indexs
         */
        getTelephoneCodes() {
            if (componentSupport.iddPrefixes.length <= 0) {
                // keep a copy of what we've alrady added (to avoid duplicates)
                const existance = {};

                // add empty option
                componentSupport.iddPrefixes.push({ value: '', label: '', countryCode: '' });

                // filter app country data to return country codes
                componentSupport.countryData.forEach(item => {
                    const telCode = parseInt(item.code[0] || '-1', 10);
                    const population = item.population;

                    if (telCode > -1) {

                        // if we've already use this country code but we have a new one with a greater population, remove the old one
                        if (existance[telCode] || population > existance[telCode]) {
                            componentSupport.iddPrefixes = componentSupport.iddPrefixes.filter(iid => (iid.value !== telCode));
                        }

                        componentSupport.iddPrefixes.push({
                            value: telCode,
                            label: telCode,
                            countryCode: item.iso
                        });

                        // store a copy of this value as a property (makes existance testing faster)
                        existance[telCode] = population;
                    }
                });

                // TODO: FIX: nested-ternary are very unreadable. Saving lines for readbility is insane.
                // store the sorted list of international dialing codes on app object to we only have to done this once
                // eslint-disable-next-line no-confusing-arrow
                componentSupport.iddPrefixes = componentSupport.iddPrefixes.sort((a, b) =>
                    // eslint-disable-next-line no-nested-ternary
                    a.value > b.value ? 1 : a.value < b.value ? -1 : 0
                );
            }

            // return sorted array
            return componentSupport.iddPrefixes;
        }
    };

    return componentSupport;
});
