import * as Rx from "rxjs";
import { map, distinctUntilChanged, filter, tap } from "rxjs/operators";
import * as L from "./lens";
import { getCurrentValue } from "./observables";
export function atom(x, y) {
    if (arguments.length == 1) {
        var initial = x;
        //console.log("Create an independent Atom", initial)
        var subject_1 = new Rx.BehaviorSubject(initial);
        var theAtom_1 = subject_1.pipe(distinctUntilChanged());
        var get_1 = function () { return subject_1.getValue(); };
        var modify = function (f) {
            subject_1.next(f(get_1()));
            return theAtom_1;
        };
        var set = function (a) {
            subject_1.next(a);
            return theAtom_1;
        };
        return mkAtom(theAtom_1, get_1, modify, set, true);
    }
    else {
        // console.log("Create dependent Atom")
        var property_1 = x;
        var eager = property_1.eager;
        var onChange_1 = y;
        var theAtom_2 = property_1.pipe(map(function (x) { return x; }), distinctUntilChanged());
        var get_2 = function () { return getCurrentValue(property_1); };
        var set_1 = function (newValue) {
            onChange_1(newValue);
            return theAtom_2;
        };
        var modify = function (f) {
            set_1(f(get_2()));
            return theAtom_2;
        };
        return mkAtom(theAtom_2, get_2, modify, set_1, eager);
    }
}
export function isAtom(x) {
    return !!((x instanceof Rx.Observable) && x.get && (x.freezeUnless));
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
        var freezingProperty = theAtom.pipe(filter(freezeUnlessFn), tap(function (v) { previousValue = v; }));
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
    var theAtom = root.pipe(map(function (value) { return lens.get(value); }), distinctUntilChanged());
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