import { applyScope } from "./applyscope";
import { EventStreamSeed } from "./eggs";
export function interval(delay, value, scope) {
    var seed = new EventStreamSeed("interval(" + delay + ", " + value + ")", function (observer) {
        var interval = setInterval(function () { return observer(value); }, delay);
        return function () { return clearInterval(interval); };
    });
    if (scope !== undefined) {
        return applyScope(scope, seed);
    }
    return seed;
}
//# sourceMappingURL=interval.js.map