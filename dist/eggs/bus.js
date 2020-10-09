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
import { StatefulEventStream } from "./eventstream";
import { globalScope } from "./scope";
export function bus() {
    return new BusImpl();
}
// Note that we could use a Dispatcher as Bus, except for prototype inheritance of EventStream on the way
var BusImpl = /** @class */ (function (_super) {
    __extends(BusImpl, _super);
    function BusImpl() {
        var _this = _super.call(this, "bus", globalScope) || this;
        _this.push = _this.push.bind(_this);
        return _this;
    }
    BusImpl.prototype.push = function (newValue) {
        this.dispatcher.dispatch("value", newValue);
    };
    return BusImpl;
}(StatefulEventStream));
//# sourceMappingURL=bus.js.map