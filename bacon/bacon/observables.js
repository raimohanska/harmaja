import * as O from "baconjs";
import * as A from "./atom";
import { getCurrentValue } from "./currentvalue";
export function bus() {
    return new O.Bus();
}
export function get(prop) {
    return getCurrentValue(prop);
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
    if (A.isAtom(a)) {
        return a.view(key);
    }
    else if (a instanceof O.Property) {
        return a.map(function (x) { return x[key]; });
    }
    else {
        throw Error("Unknown observable: " + a);
    }
}
export function filter(a, fn) {
    if (A.isAtom(a)) {
        return a.freezeUnless(fn);
    }
    else if (a instanceof O.Property) {
        return a.filter(fn);
    }
    else {
        throw Error("Unknown observable: " + a);
    }
}
//# sourceMappingURL=observables.js.map