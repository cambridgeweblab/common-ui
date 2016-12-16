define('is-mobile', [], () =>
    function isMobile() {
        return (/ipod|ipad|iphone|android/i.test(navigator.userAgent || ''));
    }
);
