import { Dispatcher } from "./dispatcher";
export var globalScope = function (onIn, onOut, dispatcher) {
    onIn();
};
export function scope() {
    var started = false;
    var scopeDispatcher = new Dispatcher();
    return {
        apply: function (onIn, onOut, dispatcher) {
            if (started) {
                onIn();
            }
            else {
                scopeDispatcher.on("in", onIn);
            }
            scopeDispatcher.on("out", onOut);
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
export var autoScope = function (onIn, onOut, dispatcher) {
    if (dispatcher.hasObservers()) {
        onIn();
    }
    var ended = false;
    dispatcher.onObserverCount(function (count) {
        if (count > 0) {
            if (ended)
                throw new Error("autoScope reactivation attempted");
            onIn();
        }
        else {
            ended = true;
            onOut();
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