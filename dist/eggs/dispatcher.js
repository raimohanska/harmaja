var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var meta = "__meta";
var Dispatcher = /** @class */ (function () {
    function Dispatcher() {
        this.observers = {};
        this.count = 0;
    }
    Dispatcher.prototype.dispatch = function (key, value) {
        var e_1, _a;
        if (this.observers[key])
            try {
                for (var _b = __values(this.observers[key]), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var s = _c.value;
                    s(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
    };
    Dispatcher.prototype.on = function (key, subscriber) {
        var _this = this;
        var _a;
        if (!this.observers[key])
            this.observers[key] = [];
        if ((_a = this.observers[key]) === null || _a === void 0 ? void 0 : _a.includes(subscriber)) {
            console.warn("Already subscribed");
        }
        this.observers[key].push(subscriber);
        if (key !== meta) {
            this.count++;
            if (this.count == 1) {
                this.dispatch(meta, 1);
            }
        }
        return function () { return _this.off(key, subscriber); };
    };
    Dispatcher.prototype.off = function (key, subscriber) {
        var _a;
        if (!this.observers[key])
            return;
        var index = this.observers[key].indexOf(subscriber);
        if (index >= 0) {
            this.observers[key].splice(index, 1);
            if (((_a = this.observers.key) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                delete this.observers[key];
            }
            if (key !== meta) {
                this.count--;
                if (this.count == 0) {
                    this.dispatch(meta, 0);
                }
            }
        }
    };
    Dispatcher.prototype.onObserverCount = function (subscriber) {
        return this.on(meta, subscriber);
    };
    Dispatcher.prototype.hasObservers = function () {
        return this.count > 0;
    };
    return Dispatcher;
}());
export { Dispatcher };
//# sourceMappingURL=dispatcher.js.map