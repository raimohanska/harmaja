import * as Rx from "rxjs";
import * as RxOps from "rxjs/operators";
import * as A from "./atom";
export function bus() {
    return new Rx.Subject();
}
export function pushAndEnd(bus, value) {
    var subject = bus;
    subject.next(value);
    subject.complete();
}
export function get(prop) {
    return getCurrentValue(prop);
}
export function set(atom, value) {
    atom.set(value);
}
export function isProperty(x) {
    return x instanceof Rx.Observable;
}
export function forEach(x, fn) {
    return _forEach(x, fn);
}
export function view(a, key) {
    if (A.isAtom(a)) {
        return a.view(key);
    }
    else if (a instanceof Rx.Observable) {
        return a.pipe(RxOps.map(function (x) { return x[key]; }));
    }
    else {
        throw Error("Unknown observable: " + a);
    }
}
export function filter(a, fn) {
    if (A.isAtom(a)) {
        return a.freezeUnless(fn);
    }
    else if (a instanceof Rx.Observable) {
        return a.pipe(RxOps.filter(fn));
    }
    else {
        throw Error("Unknown observable: " + a);
    }
}
export var valueMissing = {};
export function _forEach(x, fn) {
    var subscription = x.pipe(RxOps.tap(function (value) {
        fn(value);
    })).subscribe(function () { }, function (error) {
        console.error("Caught error event", error);
        throw new Error("Got error from observable " + x + ": " + error + ". Harmaja does not handle errors.");
    }, function () { });
    return function () { return subscription.unsubscribe(); };
}
export function getCurrentValue(observable) {
    var currentV = valueMissing;
    if (observable.get) {
        currentV = observable.get(); // For Atoms
    }
    else {
        _forEach(observable.pipe(RxOps.take(1)), function (v) { return currentV = v; });
    }
    if (currentV === valueMissing) {
        console.log("Current value not found!", observable);
        throw new Error("Current value missing. Cannot render. " + observable);
    }
    return currentV;
}
;
export var observablesThrowError = false;
export var observablesImplementationName = "RxJs";
//# sourceMappingURL=observables.js.map