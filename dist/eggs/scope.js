import { Dispatcher } from "./dispatcher";
export var GlobalScope = {
    on: function (event, observer) {
        if (event === "in") {
            observer();
        }
        return function () { };
    }
};
export function scope() {
    var started = false;
    var dispatcher = new Dispatcher();
    return {
        on: function (event, observer) {
            if (event === "in" && started) {
                observer();
                return function () { };
            }
            else {
                return dispatcher.on(event, observer);
            }
        },
        start: function () {
            started = true;
            dispatcher.dispatch("in");
        },
        end: function () {
            started = false;
            dispatcher.dispatch("out");
        }
    };
}
export var outOfScope = {};
//# sourceMappingURL=scope.js.map