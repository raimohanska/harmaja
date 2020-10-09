var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import * as L from "../lens";
import { Atom } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { afterScope, beforeScope, checkScope, globalScope } from "./scope";
import { duplicateSkippingObserver } from "./util";
var RootAtom = /** @class */ (function (_super) {
    __extends(RootAtom, _super);
    function RootAtom(desc, initialValue) {
        var _this = _super.call(this, desc) || this;
        _this.dispatcher = new Dispatcher();
        _this.value = initialValue;
        return _this;
    }
    RootAtom.prototype.on = function (event, observer) {
        var unsub = this.dispatcher.on(event, observer);
        if (event === "value") {
            observer(this.get());
        }
        return unsub;
    };
    RootAtom.prototype.get = function () {
        return this.value;
    };
    RootAtom.prototype.set = function (newValue) {
        this.value = newValue;
        this.dispatcher.dispatch("value", newValue);
        this.dispatcher.dispatch("change", newValue);
    };
    RootAtom.prototype.modify = function (fn) {
        this.set(fn(this.value));
    };
    RootAtom.prototype.scope = function () {
        return globalScope;
    };
    return RootAtom;
}(Atom));
var LensedAtom = /** @class */ (function (_super) {
    __extends(LensedAtom, _super);
    function LensedAtom(desc, root, view) {
        var _this = _super.call(this, desc) || this;
        _this.root = root;
        _this.lens = view;
        return _this;
    }
    LensedAtom.prototype.get = function () {
        return this.lens.get(this.root.get());
    };
    LensedAtom.prototype.set = function (newValue) {
        this.root.set(this.lens.set(this.root.get(), newValue));
    };
    LensedAtom.prototype.modify = function (fn) {
        var _this = this;
        this.root.modify(function (oldRoot) { return _this.lens.set(oldRoot, fn(_this.lens.get(oldRoot))); });
    };
    LensedAtom.prototype.on = function (event, observer) {
        var _this = this;
        var unsub = this.root.on("change", function (newRoot) {
            statefulObserver(_this.lens.get(newRoot));
        });
        var initial = this.get();
        var statefulObserver = duplicateSkippingObserver(initial, observer);
        if (event === "value") {
            observer(initial);
        }
        return unsub;
    };
    LensedAtom.prototype.scope = function () {
        return this.root.scope();
    };
    return LensedAtom;
}(Atom));
var DependentAtom = /** @class */ (function (_super) {
    __extends(DependentAtom, _super);
    function DependentAtom(desc, input, onChange) {
        var _this = _super.call(this, desc) || this;
        _this.input = input;
        _this.onChange = onChange;
        return _this;
    }
    DependentAtom.prototype.get = function () {
        return this.input.get();
    };
    DependentAtom.prototype.set = function (newValue) {
        this.onChange(newValue);
    };
    DependentAtom.prototype.modify = function (fn) {
        this.set(fn(this.get()));
    };
    DependentAtom.prototype.on = function (event, observer) {
        return this.input.on(event, observer);
    };
    DependentAtom.prototype.scope = function () {
        return this.input.scope();
    };
    return DependentAtom;
}(Atom));
var StatefulDependentAtom = /** @class */ (function (_super) {
    __extends(StatefulDependentAtom, _super);
    function StatefulDependentAtom(seed, scope) {
        var _this = _super.call(this, seed.desc) || this;
        _this.dispatcher = new Dispatcher();
        _this.value = beforeScope;
        _this._scope = scope;
        _this.set = seed.set;
        var meAsObserver = function (newValue) {
            _this.value = newValue;
            _this.dispatcher.dispatch("change", newValue);
            _this.dispatcher.dispatch("value", newValue);
        };
        scope(function () {
            var _a = __read(seed.subscribe(meAsObserver), 2), newValue = _a[0], unsub = _a[1];
            _this.value = newValue;
            return function () {
                _this.value = afterScope;
                unsub();
            };
        }, _this.dispatcher);
        return _this;
    }
    StatefulDependentAtom.prototype.get = function () {
        return checkScope(this, this.value);
    };
    StatefulDependentAtom.prototype.modify = function (fn) {
        this.set(fn(this.get()));
    };
    StatefulDependentAtom.prototype.on = function (event, observer) {
        var unsub = this.dispatcher.on(event, observer);
        if (event === "value") {
            observer(this.get());
        }
        return unsub;
    };
    StatefulDependentAtom.prototype.scope = function () {
        return this._scope;
    };
    return StatefulDependentAtom;
}(Atom));
export { StatefulDependentAtom };
export function view(atom, view) {
    if (typeof view === "string") {
        return new LensedAtom(atom + "." + view, atom, L.prop(view));
    }
    else if (typeof view === "number") {
        return new LensedAtom(atom + ("[" + view + "]"), atom, L.item(view));
    }
    else {
        return new LensedAtom(atom + ".view(..)", atom, view);
    }
}
export function atom(x, y) {
    if (arguments.length == 1) {
        return new RootAtom("RootAtom", x);
    }
    else {
        return new DependentAtom("DependentAtom(" + x + ")", x, y);
    }
}
//# sourceMappingURL=atom.js.map