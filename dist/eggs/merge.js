import { EventStream, EventStreamSeed } from "./abstractions";
import { StatelessEventStream } from "./eventstream";
export function merge() {
    var streams = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        streams[_i] = arguments[_i];
    }
    var seed = new EventStreamSeed("merge(" + streams + ")", function (observer) {
        var unsubs = streams.map(function (s) { return s.forEach(observer); });
        return function () { return unsubs.forEach(function (f) { return f(); }); };
    });
    if (streams[0] instanceof EventStream) {
        return new StatelessEventStream(seed, streams[0].scope);
    }
    return seed;
}
//# sourceMappingURL=merge.js.map