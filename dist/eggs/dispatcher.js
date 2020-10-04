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
var Dispatcher = /** @class */ (function () {
    function Dispatcher() {
        this.subscribers = {};
    }
    Dispatcher.prototype.dispatch = function (key, value) {
        var e_1, _a;
        if (this.subscribers[key])
            try {
                for (var _b = __values(this.subscribers[key]), _c = _b.next(); !_c.done; _c = _b.next()) {
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
        if (!this.subscribers[key])
            this.subscribers[key] = [];
        this.subscribers[key].push(subscriber);
        return function () { return _this.off(key, subscriber); };
    };
    Dispatcher.prototype.off = function (key, subscriber) {
        if (!this.subscribers[key])
            return;
        var index = this.subscribers[key].indexOf(subscriber);
        if (index >= 0) {
            this.subscribers[key].splice(index, 1);
        }
    };
    Dispatcher.prototype.hasObservers = function (key) {
        return this.subscribers[key] !== undefined && this.subscribers[key].length > 0;
    };
    return Dispatcher;
}());
export { Dispatcher };
//# sourceMappingURL=dispatcher.js.map