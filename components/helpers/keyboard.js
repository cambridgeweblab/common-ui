define('keyboard', [], () => {
    const keyboard = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        HOME: 36,
        END: 35,
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        ZERO: 48,
        NINE: 57,
        A: 65,
        Z: 90,

        navKeys(e) {
            switch (e.keyCode) {
                case keyboard.BACKSPACE:
                case keyboard.TAB:
                case keyboard.ESC:
                case keyboard.PAGE_UP:
                case keyboard.PAGE_DOWN:
                case keyboard.HOME:
                case keyboard.END:
                case keyboard.LEFT:
                case keyboard.RIGHT:
                case keyboard.UP:
                case keyboard.DOWN:
                    return true;
                default: return false;
            }
        },
        AtoZ(e) {
            return (!e.altKey && e.keyCode >= this.A && e.keyCode <= this.Z);
        },
        ZEROtoNINE(e) {
            return (!e.shiftKey && !e.altKey && e.keyCode >= this.ZERO && e.keyCode <= this.NINE);
        }
    };

    return keyboard;
});
