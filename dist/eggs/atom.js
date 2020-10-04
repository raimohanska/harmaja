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
import { Atom } from "./abstractions";
import { duplicateSkippingObserver } from "./util";
import * as L from "../lens";
import { Dispatcher } from "./dispatcher";
import { outOfScope } from "./scope";
var RootAtom = /** @class */ (function (_super) {
    __extends(RootAtom, _super);
    function RootAtom(initialValue) {
        var _this = _super.call(this) || this;
        _this.dispatcher = new Dispatcher();
        _this.value = initialValue;
        return _this;
    }
    RootAtom.prototype.on = function (event, observer) {
        if (event === "value") {
            observer(this.get());
        }
        return this.dispatcher.on(event, observer);
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
    return RootAtom;
}(Atom));
var LensedAtom = /** @class */ (function (_super) {
    __extends(LensedAtom, _super);
    function LensedAtom(root, view) {
        var _this = _super.call(this) || this;
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
        var initial = this.get();
        var statefulObserver = duplicateSkippingObserver(initial, observer);
        if (event === "value") {
            observer(initial);
        }
        return this.root.on("change", function (newRoot) {
            statefulObserver(_this.lens.get(newRoot));
        });
    };
    return LensedAtom;
}(Atom));
var DependentAtom = /** @class */ (function (_super) {
    __extends(DependentAtom, _super);
    function DependentAtom(input, onChange) {
        var _this = _super.call(this) || this;
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
    return DependentAtom;
}(Atom));
var StatefulDependentAtom = /** @class */ (function (_super) {
    __extends(StatefulDependentAtom, _super);
    function StatefulDependentAtom(scope, source, onChange) {
        var _this = _super.call(this) || this;
        _this.dispatcher = new Dispatcher();
        _this.value = outOfScope;
        _this.onChange = onChange;
        var meAsObserver = function (newValue) {
            _this.value = newValue;
            _this.dispatcher.dispatch("change", newValue);
            _this.dispatcher.dispatch("value", newValue);
        };
        scope.on("in", function () {
            _this.value = source(meAsObserver);
        });
        scope.on("out", function () {
            _this.value = outOfScope;
        });
        return _this;
    }
    StatefulDependentAtom.prototype.get = function () {
        if (this.value === outOfScope)
            throw Error("Atom out of scope");
        return this.value;
    };
    StatefulDependentAtom.prototype.set = function (newValue) {
        this.onChange(newValue);
    };
    StatefulDependentAtom.prototype.modify = function (fn) {
        this.set(fn(this.get()));
    };
    StatefulDependentAtom.prototype.on = function (event, observer) {
        if (event === "value") {
            observer(this.get());
        }
        return this.dispatcher.on(event, observer);
    };
    return StatefulDependentAtom;
}(Atom));
export { StatefulDependentAtom };
export function view(atom, view) {
    if (typeof view === "string") {
        return new LensedAtom(atom, L.prop(view));
    }
    else if (typeof view === "number") {
        return new LensedAtom(atom, L.item(view));
    }
    else {
        return new LensedAtom(atom, view);
    }
}
export function atom(x, y) {
    if (arguments.length == 1) {
        return new RootAtom(x);
    }
    else {
        return new DependentAtom(x, y);
    }
}
export function freezeUnless(scope, atom, freezeUnlessFn) {
    var onChange = function (v) { return atom.set(v); };
    var source = function (observer) {
        var initial = atom.get();
        if (!freezeUnlessFn(initial)) {
            throw Error("Cannot create frozen atom with initial value not passing the given filter function");
        }
        atom.on("change", function (newValue) {
            if (freezeUnlessFn(newValue)) {
                observer(newValue);
            }
        });
        return atom.get();
    };
    return new StatefulDependentAtom(scope, source, onChange);
}
//# sourceMappingURL=atom.js.map