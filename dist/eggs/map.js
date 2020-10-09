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
import { StatelessEventStream } from "./eventstream";
import { DerivedProperty } from "./property";
export function map(o, fn) {
    var desc = o + ".map(fn)";
    if (o instanceof EventStream) {
        return new StatelessEventStream(desc, function (observer) { return o.forEach(function (v) { return observer(fn(v)); }); }, o.scope());
    }
    else if (o instanceof EventStreamSeed) {
        return new EventStreamSeed(desc, function (observer) { return o.forEach(function (v) { return observer(fn(v)); }); });
    }
    else if (o instanceof Property) {
        return new DerivedProperty(desc, [o], fn);
    }
    else if (o instanceof PropertySeed) {
        return new PropertySeed(desc, function (observer) {
            var _a = __read(o.subscribe(function (value) { return observer(fn(value)); }), 2), value = _a[0], unsub = _a[1];
            return [fn(value), unsub];
        });
    }
    throw Error("Unknown observable");
}
//# sourceMappingURL=map.js.map