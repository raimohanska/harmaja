var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import * as B from "baconjs";
import { getCurrentValue } from "./harmaja";
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
        theAtom_1.subscribe(function () { });
        return mkAtom(theAtom_1, get, modify);
    }
    else {
        // Create a dependent Atom
        var property = x;
        var onChange_1 = y;
        var theAtom_2 = property.map(function (x) { return x; }).skipDuplicates(function (a, b) { return a === b; });
        var get_1 = function () { return getCurrentValue(theAtom_2); };
        var set_1 = function (newValue) {
            onChange_1(newValue);
            return theAtom_2;
        };
        var modify = function (f) {
            set_1(f(get_1()));
            return theAtom_2;
        };
        get_1(); // Sanity check: the given property must have an initial value
        return mkAtom(property, get_1, modify, set_1);
    }
}
function mkAtom(observable, get, modify, set) {
    var theAtom = observable;
    theAtom.set = function (newValue) {
        theAtom.modify(function () { return newValue; });
        return theAtom;
    };
    theAtom.modify = modify;
    theAtom.get = get;
    theAtom.freezeUnless = function (freezeUnlessFn) {
        var previousValue = getCurrentValue(observable);
        if (!freezeUnlessFn(previousValue)) {
            throw Error("Cannot create frozen atom with initial value not passing the given filter function");
        }
        var fa = atom(theAtom.filter(freezeUnlessFn), function (newValue) { return theAtom.set(newValue); });
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
            var lens = {
                get: function (root) { return root[view]; },
                set: function (root, newValue) {
                    var _a;
                    return (__assign(__assign({}, root), (_a = {}, _a[view] = newValue, _a)));
                }
            };
            return lensedAtom(theAtom, lens);
        }
        else if (typeof view === "number") {
            var index_1 = view;
            var lens = {
                get: function (root) { return root[view]; },
                set: function (nums, newValue) { return newValue === undefined
                    ? __spread(nums.slice(0, index_1), nums.slice(index_1 + 1)) : __spread(nums.slice(0, index_1), [newValue], nums.slice(index_1 + 1)); }
            };
            return lensedAtom(theAtom, lens);
        }
        else {
            var lens = view;
            return lensedAtom(theAtom, lens);
        }
    };
    return theAtom;
}
function lensedAtom(root, lens) {
    var theAtom = root.map(function (value) { return lens.get(value); });
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
    return mkAtom(theAtom, get, modify);
}
