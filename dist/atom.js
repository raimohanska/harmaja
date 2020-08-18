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
export function atom(initial) {
    var bus = new B.Bus();
    var theAtom = bus.scan(initial, function (v, fn) {
        var newValue = fn(v);
        theAtom.value = newValue;
        return newValue;
    }).skipDuplicates(function (a, b) { return a === b; });
    theAtom.value = initial;
    var get = function () { return theAtom.value; };
    var modify = function (f) {
        bus.push(f);
        return theAtom;
    };
    return mkAtom(theAtom, get, modify);
}
var valueMissing = {};
function mkAtom(observable, get, modify) {
    var theAtom = observable;
    theAtom.set = function (newValue) {
        theAtom.modify(function () { return newValue; });
        return theAtom;
    };
    theAtom.modify = modify;
    theAtom.subscribe(function () { });
    theAtom.get = get;
    theAtom.freezeUnless = function (freezeUnlessFn) {
        var value = valueMissing;
        var frozenAtom = mkAtom(observable.filter(function (x) { return freezeUnlessFn(x); }).doAction(function (v) { value = v; }), function () { return value; }, function (fn) { modify(fn); return frozenAtom; });
        if (value === valueMissing) {
            throw new Error("Initial value missing or matches freezing criteria, unable to construct Atom");
        }
        return frozenAtom;
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
            return lensedAtom(theAtom.freezeUnless(function (a) { return a !== undefined; }), lens);
        }
        else if (typeof view === "number") {
            var index_1 = view;
            var lens = {
                get: function (root) { return root[view]; },
                set: function (nums, newValue) { return newValue === undefined
                    ? __spread(nums.slice(0, index_1), nums.slice(index_1 + 1)) : __spread(nums.slice(0, index_1), [newValue], nums.slice(index_1 + 1)); }
            };
            return lensedAtom(theAtom.freezeUnless(function (a) { return a !== undefined; }), lens);
        }
        else {
            var lens = view;
            return lensedAtom(theAtom, lens);
        }
    };
    return theAtom;
}
// TODO skipUndefined is a hack, for freezing views into undefined objects
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
