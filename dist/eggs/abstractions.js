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
// Abstract classes instead of interfaces for runtime type information and instanceof
var Observable = /** @class */ (function () {
    function Observable(desc) {
        this.desc = desc;
    }
    Observable.prototype.forEach = function (observer) {
        return this.on("value", observer);
    };
    Observable.prototype.log = function (message) {
        this.forEach(function (v) { return message === undefined ? console.log(v) : console.log(message, v); });
    };
    Observable.prototype.toString = function () {
        return this.desc;
    };
    return Observable;
}());
export { Observable };
var Property = /** @class */ (function (_super) {
    __extends(Property, _super);
    function Property(desc) {
        return _super.call(this, desc) || this;
    }
    return Property;
}(Observable));
export { Property };
var EventStream = /** @class */ (function (_super) {
    __extends(EventStream, _super);
    function EventStream(desc) {
        return _super.call(this, desc) || this;
    }
    return EventStream;
}(Observable));
export { EventStream };
var Atom = /** @class */ (function (_super) {
    __extends(Atom, _super);
    function Atom(desc) {
        return _super.call(this, desc) || this;
    }
    return Atom;
}(Property));
export { Atom };
//# sourceMappingURL=abstractions.js.map