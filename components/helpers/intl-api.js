define('intl-api', [], () => {
    if (!window.Intl) {
        const preferredLocale = (navigator.languages && navigator.languages.length && navigator.languages[0]) || navigator.browserLanguage || navigator.language;
        const preferredLanguage = preferredLocale.indexOf('-') > 0 ? preferredLocale.substring(0, preferredLocale.indexOf('-')) : preferredLocale;
        const scriptEl = document.createElement('script');
        scriptEl.src = `https://cdn.polyfill.io/v2/polyfill.min.js?features=Intl.~locale.${preferredLanguage}`;
        document.head.appendChild(scriptEl);
    }
    return null;
});
