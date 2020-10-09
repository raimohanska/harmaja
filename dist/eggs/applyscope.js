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
import { AtomSeed, EventStreamSeed, PropertySeed } from "./abstractions";
import { StatefulEventStream } from "./eventstream";
import { StatefulDependentAtom } from "./atom";
import { StatefulProperty } from "./property";
export function applyScope(scope, seed) {
    if (seed instanceof EventStreamSeed) {
        return new SeedToStream(seed, scope);
    }
    else if (seed instanceof AtomSeed) {
        return new StatefulDependentAtom(seed, scope);
    }
    else if (seed instanceof PropertySeed) {
        return new StatefulProperty(seed, scope);
    }
    throw Error("Unknown seed");
}
var SeedToStream = /** @class */ (function (_super) {
    __extends(SeedToStream, _super);
    function SeedToStream(seed, scope) {
        var _this = _super.call(this, seed.desc, scope) || this;
        scope(function () { return seed.forEach(function (v) { return _this.dispatcher.dispatch("value", v); }); }, _this.dispatcher);
        return _this;
    }
    return SeedToStream;
}(StatefulEventStream));
//# sourceMappingURL=applyscope.js.map