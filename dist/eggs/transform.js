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
import { Atom, AtomSeed, EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { applyScope } from "./applyscope";
export function transform(desc, x, transformer, scope) {
    var seed;
    if (x instanceof EventStream || x instanceof EventStreamSeed) {
        seed = new EventStreamSeed(desc, function (observer) { return seed.forEach(function (value) { return transformer.changes(value, observer); }); });
    }
    else if (x instanceof Atom || x instanceof AtomSeed) {
        seed = new AtomSeed(desc, transformSubscribe(x, transformer), function (newValue) { return x.set(newValue); });
    }
    else if (x instanceof Property || x instanceof PropertySeed) {
        seed = new PropertySeed(desc, transformSubscribe(x, transformer));
    }
    else {
        throw Error("Unknown observable " + x);
    }
    if (scope !== undefined) {
        return applyScope(scope, seed);
    }
    return seed;
}
function transformSubscribe(src, transformer) {
    if (src === undefined)
        throw Error("Assertion failed");
    return function (observer) {
        var _a = __read(src.subscribe(function (value) { return transformer.changes(value, observer); }), 2), initial = _a[0], unsub = _a[1];
        return [transformer.init(initial), unsub];
    };
}
//# sourceMappingURL=transform.js.map