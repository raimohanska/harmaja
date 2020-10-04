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
import { EventStream } from "./abstractions";
import { Dispatcher } from "./dispatcher";
// Note that we could use a Dispatcher as Bus, except for prototype inheritance of EventStream on the way
var BaseEventStream = /** @class */ (function (_super) {
    __extends(BaseEventStream, _super);
    function BaseEventStream(desc) {
        var _this = _super.call(this, desc) || this;
        _this.dispatcher = new Dispatcher();
        return _this;
    }
    BaseEventStream.prototype.on = function (event, observer) {
        return this.dispatcher.on(event, observer);
    };
    return BaseEventStream;
}(EventStream));
export { BaseEventStream };
export function never() {
    return new BaseEventStream("never");
}
export function interval(scope, delay, value) {
    return new Interval(scope, delay, value);
}
var Interval = /** @class */ (function (_super) {
    __extends(Interval, _super);
    function Interval(scope, delay, value) {
        var _this = _super.call(this, "interval(" + delay + ", fn)") || this;
        var interval;
        scope(function () { return interval = setInterval(function () { return _this.dispatcher.dispatch("value", value); }, delay); }, function () { return clearInterval(interval); }, _this.dispatcher);
        return _this;
    }
    return Interval;
}(BaseEventStream));
//# sourceMappingURL=eventstream.js.map