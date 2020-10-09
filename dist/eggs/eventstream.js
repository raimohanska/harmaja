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
// Note that we could use a Dispatcher as Bus, except for prototype inheritance of EventStream on the way
var StatefulEventStream = /** @class */ (function (_super) {
    __extends(StatefulEventStream, _super);
    function StatefulEventStream(desc, scope) {
        var _this = _super.call(this, desc) || this;
        _this.dispatcher = new Dispatcher();
        _this._scope = scope;
        return _this;
    }
    StatefulEventStream.prototype.on = function (event, observer) {
        return this.dispatcher.on(event, observer);
    };
    StatefulEventStream.prototype.scope = function () {
        return this._scope;
    };
    return StatefulEventStream;
}(EventStream));
export { StatefulEventStream };
var StatelessEventStream = /** @class */ (function (_super) {
    __extends(StatelessEventStream, _super);
    function StatelessEventStream() {
        var _this = this;
        var desc, forEach, scope;
        if (arguments[0] instanceof EventStreamSeed) {
            var seed = arguments[0];
            desc = seed.desc;
            forEach = seed.forEach;
            scope = arguments[1];
        }
        else {
            desc = arguments[0];
            forEach = arguments[1];
            scope = arguments[2];
        }
        _this = _super.call(this, desc) || this;
        _this._scope = scope;
        _this.forEach = forEach;
        return _this;
    }
    StatelessEventStream.prototype.on = function (event, observer) {
        return this.forEach(observer);
    };
    StatelessEventStream.prototype.scope = function () {
        return this._scope;
    };
    return StatelessEventStream;
}(EventStream));
export { StatelessEventStream };
//# sourceMappingURL=eventstream.js.map