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
import { EventStream, EventStreamSeed } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { globalScope } from "./scope";
// Note that we could use a Dispatcher as Bus, except for prototype inheritance of EventStream on the way
var BaseEventStream = /** @class */ (function (_super) {
    __extends(BaseEventStream, _super);
    function BaseEventStream(desc, scope) {
        var _this = _super.call(this, desc) || this;
        _this.dispatcher = new Dispatcher();
        _this._scope = scope;
        return _this;
    }
    BaseEventStream.prototype.on = function (event, observer) {
        return this.dispatcher.on(event, observer);
    };
    BaseEventStream.prototype.scope = function () {
        return this._scope;
    };
    return BaseEventStream;
}(EventStream));
export { BaseEventStream };
export function never() {
    return new BaseEventStream("never", globalScope);
}
export function interval(delay, value) {
    return new EventStreamSeed("interval(" + delay + ", " + value + ")", function (observer) {
        var interval = setInterval(function () { return observer(value); }, delay);
        return function () { return clearInterval(interval); };
    });
}
//# sourceMappingURL=eventstream.js.map