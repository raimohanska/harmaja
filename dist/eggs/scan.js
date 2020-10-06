import { PropertySeed } from "./abstractions";
export function scan(stream, initial, fn) {
    return new PropertySeed(stream + ".scan(fn)", function (observer) {
        var current = initial;
        var unsub = stream.on("value", function (newValue) {
            current = fn(current, newValue);
            observer(current);
        });
        return [initial, unsub];
    });
}
//# sourceMappingURL=scan.js.map