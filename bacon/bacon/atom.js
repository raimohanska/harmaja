import * as B from "baconjs";
import * as L from "./lens";
import { getCurrentValue } from "./currentvalue";
export function atom(x, y) {
    if (arguments.length == 1) {
        // Create an independent Atom
        var initial = x;
        var bus_1 = new B.Bus();
        var theAtom_1 = bus_1.scan(initial, function (v, fn) {
            var newValue = fn(v);
            theAtom_1.value = newValue;
            return newValue;
        }).skipDuplicates(function (a, b) { return a === b; });
        theAtom_1.value = initial;
        var get = function () { return theAtom_1.value; };
        var modify = function (f) {
            bus_1.push(f);
            return theAtom_1;
        };
        var set = function (a) {
            bus_1.push(function () { return a; });
            return theAtom_1;
        };
        return mkAtom(theAtom_1, get, modify, set, true);
    }
    else {
        // Create a dependent Atom
        var property_1 = x;
        var eager = property_1.eager;
        var onChange_1 = y;
        var theAtom_2 = property_1.map(function (x) { return x; }).skipDuplicates(function (a, b) { return a === b; });
        var get_1 = function () { return getCurrentValue(property_1); };
        var set_1 = function (newValue) {
            onChange_1(newValue);
            return theAtom_2;
        };
        var modify = function (f) {
            set_1(f(get_1()));
            return theAtom_2;
        };
        return mkAtom(theAtom_2, get_1, modify, set_1, eager);
    }
}
export function isAtom(x) {
    return !!((x instanceof B.Property) && x.get && (x.freezeUnless));
}
// Note: actually mutates the given observable into an Atom!
function mkAtom(observable, get, modify, set, eager) {
    var theAtom = observable;
    theAtom.set = set;
    theAtom.modify = modify;
    theAtom.get = get;
    theAtom.freezeUnless = function (freezeUnlessFn) {
        var previousValue = getCurrentValue(observable);
        if (!freezeUnlessFn(previousValue)) {
            throw Error("Cannot create frozen atom with initial value not passing the given filter function");
        }
        var freezingProperty = theAtom.filter(freezeUnlessFn).doAction(function (v) { previousValue = v; });
        freezingProperty.eager = true;
        var onChange = function (newValue) { return theAtom.set(newValue); };
        var fa = atom(freezingProperty, onChange);
        fa.get = function () {
            var wouldBeValue = getCurrentValue(observable);
            if (freezeUnlessFn(wouldBeValue)) {
                previousValue = wouldBeValue;
            }
            return previousValue;
        };
        return fa;
    };
    theAtom.view = function (view) {
        if (typeof view === "string") {
            return lensedAtom(theAtom, L.prop(view));
        }
        else if (typeof view === "number") {
            return lensedAtom(theAtom, L.item(view));
        }
        else {
            var lens = view;
            return lensedAtom(theAtom, lens);
        }
    };
    theAtom.eager = eager;
    if (eager)
        theAtom.subscribe(function () { });
    return theAtom;
}
function lensedAtom(root, lens) {
    var theAtom = root.map(function (value) { return lens.get(value); }).skipDuplicates();
    var get = function () { return lens.get(root.get()); };
    var modify = function (fn) {
        root.modify(function (currentRootValue) {
            var currentChildValue = lens.get(currentRootValue);
            var newChildValue = fn(currentChildValue);
            var newRootValue = lens.set(currentRootValue, newChildValue);
            return newRootValue;
        });
        return theAtom;
    };
    var set = function (b) {
        var currentRootValue = root.get();
        var newRootValue = lens.set(currentRootValue, b);
        root.set(newRootValue);
        return theAtom;
    };
    return mkAtom(theAtom, get, modify, set, root.eager);
}
//# sourceMappingURL=atom.js.map