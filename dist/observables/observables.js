import * as O from "lonna";
export function bus() {
    return O.bus();
}
export function get(prop) {
    return prop.get();
}
export function set(atom, value) {
    atom.set(value);
}
export function isProperty(x) {
    return x instanceof O.Property;
}
export function forEach(x, fn) {
    return x.forEach(fn);
}
export function view(a, key) {
    return O.view(a, key);
}
export function filter(prop, fn) {
    return O.filter(prop, fn, O.autoScope);
}
//# sourceMappingURL=observables.js.map