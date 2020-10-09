import { applyScope } from "./applyscope";
import { EventStreamSeed } from "./eggs";
export function later(delay, value, scope) {
    var seed = new EventStreamSeed("interval(" + delay + ", " + value + ")", function (observer) {
        var timeout = setTimeout(function () { return observer(value); }, delay);
        return function () { return clearTimeout(timeout); };
    });
    if (scope !== undefined) {
        return applyScope(scope, seed);
    }
    return seed;
}
//# sourceMappingURL=later.js.map