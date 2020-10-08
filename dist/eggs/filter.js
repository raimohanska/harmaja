import { applyScope } from "./applyscope";
import { transform } from "./transform";
export function filter(s, fn, scope) {
    var seed = transform(s + ".map(fn)", s, filterT(fn));
    if (scope !== undefined) {
        return applyScope(scope, seed);
    }
    return seed;
}
function filterT(fn) {
    return {
        changes: function (value, observer) {
            if (fn(value)) {
                observer(value);
            }
        },
        init: function (value) {
            if (!fn(value)) {
                throw Error("Initial value not matching filter");
            }
            return value;
        }
    };
}
//# sourceMappingURL=filter.js.map