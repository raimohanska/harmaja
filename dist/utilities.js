import * as B from "baconjs";
export var valueMissing = {};
export function getCurrentValue(observable) {
    var currentV = valueMissing;
    if (observable.get) {
        currentV = observable.get(); // For Atoms
    }
    else {
        var unsub = observable.subscribeInternal(function (e) {
            if (B.hasValue(e)) {
                currentV = e.value;
            }
        });
        unsub();
    }
    if (currentV === valueMissing) {
        console.log("Current value not found!", observable);
        throw new Error("Current value missing. Cannot render. " + observable);
    }
    return currentV;
}
;
export function reportValueMissing(observable) {
    console.log("Current value not found!", observable);
    throw new Error("Current value missing. Cannot render. " + observable);
}
//# sourceMappingURL=utilities.js.map