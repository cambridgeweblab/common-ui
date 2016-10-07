define('types', [], () => {

    /**
    * toBoolean - casts a string value to boolean.
    * @param {string} value - value to cast to boolean.
    * @return {boolean} true/false - eval of value.
    */
    function toBoolean(value = false) {
        return value === 'true';
    }

    /**
     * isValidEmailAddress - returns if email passes regex validation
     * @param {string} emailAddress - email address string to validate
     * @return {boolean} email address is valid
     */
    function isValidEmailAddress(emailAddress) {
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(emailAddress);
    }

    return {
        toBoolean,
        isValidEmailAddress
    };
});
