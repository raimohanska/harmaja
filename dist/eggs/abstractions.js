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
    function Observable() {
    }
    return Observable;
}());
export { Observable };
var MulticastObservable = /** @class */ (function (_super) {
    __extends(MulticastObservable, _super);
    function MulticastObservable(desc) {
        var _this = _super.call(this) || this;
        _this.desc = desc;
        return _this;
    }
    MulticastObservable.prototype.forEach = function (observer) {
        return this.on("value", observer);
    };
    MulticastObservable.prototype.log = function (message) {
        this.forEach(function (v) { return message === undefined ? console.log(v) : console.log(message, v); });
    };
    MulticastObservable.prototype.toString = function () {
        return this.desc;
    };
    return MulticastObservable;
}(Observable));
export { MulticastObservable };
var Property = /** @class */ (function (_super) {
    __extends(Property, _super);
    function Property(desc) {
        return _super.call(this, desc) || this;
    }
    Property.prototype.subscribe = function (observer) {
        var unsub = this.on("change", observer);
        return [this.get(), unsub];
    };
    return Property;
}(MulticastObservable));
export { Property };
/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
var PropertySeed = /** @class */ (function () {
    function PropertySeed(desc, forEach) {
        this.subscribe = forEach;
        this.desc = desc;
    }
    return PropertySeed;
}());
export { PropertySeed };
var EventStream = /** @class */ (function (_super) {
    __extends(EventStream, _super);
    function EventStream(desc) {
        return _super.call(this, desc) || this;
    }
    return EventStream;
}(MulticastObservable));
export { EventStream };
var EventStreamSeed = /** @class */ (function (_super) {
    __extends(EventStreamSeed, _super);
    function EventStreamSeed(desc, forEach) {
        var _this = _super.call(this) || this;
        _this.forEach = forEach;
        _this.desc = desc;
        return _this;
    }
    return EventStreamSeed;
}(Observable));
export { EventStreamSeed };
var Atom = /** @class */ (function (_super) {
    __extends(Atom, _super);
    function Atom(desc) {
        return _super.call(this, desc) || this;
    }
    return Atom;
}(Property));
export { Atom };
/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
var AtomSeed = /** @class */ (function (_super) {
    __extends(AtomSeed, _super);
    function AtomSeed(desc, forEach, set) {
        var _this = _super.call(this, desc, forEach) || this;
        _this.set = set;
        return _this;
    }
    return AtomSeed;
}(PropertySeed));
export { AtomSeed };
//# sourceMappingURL=abstractions.js.map