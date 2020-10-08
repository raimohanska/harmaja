import { PropertySeed } from "./abstractions";
import { applyScope } from "./applyscope";
export function scan(stream, initial, fn, scope) {
    var seed = new PropertySeed(stream + ".scan(fn)", function (observer) {
        var current = initial;
        var unsub = stream.forEach(function (newValue) {
            current = fn(current, newValue);
            observer(current);
        });
        return [initial, unsub];
    });
    if (scope)
        return applyScope(scope, seed);
    return seed;
}
//# sourceMappingURL=scan.js.map