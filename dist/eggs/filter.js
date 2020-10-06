import { PropertySeed } from "./abstractions";
import { StatefulProperty } from "./property";
// TODO: apply to seeds and observables (freezeUnless is actually filter for Atoms!)
export function filter(scope, prop, predicate) {
    var forEach = function (propertyAsChangeObserver) {
        var unsub = prop.on("change", function (newValue) {
            if (predicate(newValue)) {
                propertyAsChangeObserver(newValue);
            }
        });
        var initialValue = prop.get();
        if (!predicate(initialValue)) {
            throw Error("Initial value not matching filter for " + prop);
        }
        return [initialValue, unsub];
    };
    var seed = new PropertySeed(prop + ".map(fn)", forEach);
    return new StatefulProperty(seed, scope);
}
//# sourceMappingURL=filter.js.map