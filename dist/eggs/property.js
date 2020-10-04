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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import { Property } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { never } from "./eventstream";
import { afterScope, beforeScope, checkScope, GlobalScope } from "./scope";
import { duplicateSkippingObserver } from "./util";
var StatefulPropertyBase = /** @class */ (function (_super) {
    __extends(StatefulPropertyBase, _super);
    function StatefulPropertyBase(desc) {
        var _this = _super.call(this, desc) || this;
        _this.dispatcher = new Dispatcher();
        return _this;
    }
    StatefulPropertyBase.prototype.on = function (event, observer) {
        var unsub = this.dispatcher.on(event, observer);
        if (event === "value") {
            observer(this.get());
        }
        return unsub;
    };
    return StatefulPropertyBase;
}(Property));
export { StatefulPropertyBase };
var DerivedProperty = /** @class */ (function (_super) {
    __extends(DerivedProperty, _super);
    function DerivedProperty(desc, sources, combinator) {
        var _this = _super.call(this, desc) || this;
        _this.sources = sources;
        _this.combinator = combinator;
        return _this;
    }
    DerivedProperty.prototype.get = function () {
        return this.combinator.apply(this, __spread(this.getCurrentArray()));
    };
    DerivedProperty.prototype.getCurrentArray = function () {
        return this.sources.map(function (s) { return s.get(); });
    };
    DerivedProperty.prototype.on = function (event, observer) {
        var _this = this;
        var unsubs = this.sources.map(function (src, i) {
            return src.on("change", function (newValue) {
                currentArray[i] = newValue;
                statefulObserver(_this.combinator.apply(_this, __spread(currentArray)));
            });
        });
        var currentArray = this.getCurrentArray();
        var initial = this.combinator.apply(this, __spread(currentArray));
        var statefulObserver = duplicateSkippingObserver(initial, observer);
        if (event === "value") {
            observer(initial);
        }
        return function () {
            unsubs.forEach(function (f) { return f(); });
        };
    };
    return DerivedProperty;
}(Property));
export { DerivedProperty };
var StatefulProperty = /** @class */ (function (_super) {
    __extends(StatefulProperty, _super);
    function StatefulProperty(desc, scope, source) {
        var _this = _super.call(this, desc) || this;
        _this.value = beforeScope;
        var unsub = null;
        var meAsObserver = function (newValue) {
            if (newValue !== _this.value) {
                _this.value = newValue;
                _this.dispatcher.dispatch("change", newValue);
                _this.dispatcher.dispatch("value", newValue);
            }
        };
        scope(function () {
            var _a;
            _a = __read(source(meAsObserver), 2), _this.value = _a[0], unsub = _a[1];
        }, function () {
            _this.value = afterScope;
            unsub();
        }, _this.dispatcher);
        return _this;
    }
    StatefulProperty.prototype.get = function () {
        return checkScope(this, this.value);
    };
    return StatefulProperty;
}(StatefulPropertyBase));
export { StatefulProperty };
export function map(prop, fn) {
    return new DerivedProperty(prop + ".map(fn)", [prop], fn);
}
export function filter(scope, prop, predicate) {
    var source = function (propertyAsChangeObserver) {
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
    return new StatefulProperty(prop + ".map(fn)", scope, source);
}
export function toProperty(scope, stream, initial) {
    var source = function (propertyAsChangeObserver) {
        return [initial, stream.on("value", propertyAsChangeObserver)];
    };
    return new StatefulProperty(stream + (".toProperty(" + initial + ")"), scope, source);
}
export function scan(scope, stream, initial, fn) {
    var source = function (propertyAsChangeObserver) {
        var current = initial;
        var unsub = stream.on("value", function (newValue) {
            current = fn(current, newValue);
            propertyAsChangeObserver(current);
        });
        return [initial, unsub];
    };
    return new StatefulProperty(stream + ".scan(fn)", scope, source);
}
export function constant(value) {
    return toProperty(GlobalScope, never(), value);
}
//# sourceMappingURL=property.js.map