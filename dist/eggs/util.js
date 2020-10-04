export function duplicateSkippingObserver(initial, observer) {
    var current = initial;
    return function (newValue) {
        if (newValue !== current) {
            current = newValue;
            observer(newValue);
        }
    };
}
//# sourceMappingURL=util.js.map