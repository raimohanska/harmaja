import { combine } from "./combine";
import { map } from "./map";
export function or(left, right) {
    return combine(left, right, function (x, y) { return x || y; });
}
export function and(left, right) {
    return combine(left, right, function (x, y) { return x && y; });
}
export function not(prop) {
    return map(prop, function (x) { return !x; });
}
//# sourceMappingURL=boolean.js.map