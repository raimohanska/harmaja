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
import { Property, PropertySeed } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { never } from "./never";
import { beforeScope, checkScope, globalScope } from "./scope";
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
    DerivedProperty.prototype.scope = function () {
        if (this.sources.length === 0)
            return globalScope;
        return this.sources[0].scope();
    };
    return DerivedProperty;
}(Property));
export { DerivedProperty };
var StatefulProperty = /** @class */ (function (_super) {
    __extends(StatefulProperty, _super);
    function StatefulProperty(seed, scope) {
        var _this = _super.call(this, seed.desc) || this;
        _this.value = beforeScope;
        _this._scope = scope;
        var meAsObserver = function (newValue) {
            if (newValue !== _this.value) {
                _this.value = newValue;
                _this.dispatcher.dispatch("change", newValue);
                _this.dispatcher.dispatch("value", newValue);
            }
        };
        scope(function () {
            var _a = __read(seed.subscribe(meAsObserver), 2), newValue = _a[0], unsub = _a[1];
            _this.value = newValue;
            return unsub;
        }, _this.dispatcher);
        return _this;
    }
    StatefulProperty.prototype.get = function () {
        return checkScope(this, this.value);
    };
    StatefulProperty.prototype.scope = function () {
        return this._scope;
    };
    return StatefulProperty;
}(StatefulPropertyBase));
export { StatefulProperty };
export function toPropertySeed(stream, initial) {
    var forEach = function (observer) {
        return [initial, stream.forEach(observer)];
    };
    return new PropertySeed(stream + (".toProperty(" + initial + ")"), forEach);
}
export function toProperty(stream, initial, scope) {
    return new StatefulProperty(toPropertySeed(stream, initial), scope);
}
export function constant(value) {
    return toProperty(never(), value, globalScope);
}
//# sourceMappingURL=property.js.map