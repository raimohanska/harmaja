import { EventStream, EventStreamSeed, Property } from "./abstractions";
import { applyScope } from "./applyscope";
import { DerivedProperty } from "./property";
export function map(o, fn) {
    if (o instanceof EventStream) {
        return mapES(o, fn);
    }
    else if (o instanceof EventStreamSeed) {
        return mapESS(o, fn);
    }
    else if (o instanceof Property) {
        return mapP(o, fn);
    }
    throw Error("Unknown observable");
}
function mapES(s, fn) {
    return applyScope(s.scope(), mapESS(s, fn));
}
function mapESS(s, fn) {
    return new EventStreamSeed(s + ".map(fn)", function (observer) { return s.forEach(function (v) { return observer(fn(v)); }); });
}
function mapP(prop, fn) {
    return new DerivedProperty(prop + ".map(fn)", [prop], fn);
}
//# sourceMappingURL=map.js.map