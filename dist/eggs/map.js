var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
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
    else if (o instanceof PropertySeed) {
        return mapPS(o, fn);
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
function mapPS(seed, fn) {
    return new PropertySeed(seed + ".map(fn)", function (observer) {
        var _a = __read(seed.subscribe(function (value) { return observer(fn(value)); }), 2), value = _a[0], unsub = _a[1];
        return [fn(value), unsub];
    });
}
//# sourceMappingURL=map.js.map