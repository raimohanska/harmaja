import { Dispatcher } from "./dispatcher";
export var globalScope = function (onIn, dispatcher) {
    onIn();
};
export function scope() {
    var started = false;
    var scopeDispatcher = new Dispatcher();
    return {
        apply: function (onIn, dispatcher) {
            var unsub = null;
            if (started) {
                unsub = onIn();
            }
            else {
                scopeDispatcher.on("in", onIn);
            }
            scopeDispatcher.on("out", function () { return unsub(); });
        },
        start: function () {
            started = true;
            scopeDispatcher.dispatch("in", undefined);
        },
        end: function () {
            started = false;
            scopeDispatcher.dispatch("out", undefined);
        }
    };
}
/**
 *  Subscribe to source when there are observers. Use with care!
 **/
export var autoScope = function (onIn, dispatcher) {
    var unsub = null;
    if (dispatcher.hasObservers()) {
        unsub = onIn();
    }
    var ended = false;
    dispatcher.onObserverCount(function (count) {
        if (count > 0) {
            if (ended)
                throw new Error("autoScope reactivation attempted");
            unsub = onIn();
        }
        else {
            ended = true;
            unsub();
        }
    });
};
export var beforeScope = {};
export var afterScope = {};
export function checkScope(thing, value) {
    if (value === beforeScope)
        throw Error(thing + " not yet in scope");
    if (value === afterScope)
        throw Error(thing + " not yet in scope");
    return value;
}
//# sourceMappingURL=scope.js.map