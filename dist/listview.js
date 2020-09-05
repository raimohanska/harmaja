var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { LowLevelApi as H } from "./harmaja";
export function ListView(props) {
    var observable = ("atom" in props) ? props.atom : props.observable;
    var _a = props.getKey, key = _a === void 0 ? (function (x) { return x; }) : _a;
    // TODO: would work better if could return multiple elements!
    var currentElements = [H.createPlaceholder()];
    var currentValues = null;
    H.attachOnMount(currentElements[0], function () {
        var unsub = observable.forEach(function (nextValues) {
            var e_1, _a;
            var unmounts = H.detachOnUnmounts(currentElements[0]);
            if (!currentValues) {
                if (nextValues.length) {
                    var nextElements = nextValues.map(function (x, i) { return renderItem(key(x), nextValues, i); }).flatMap(H.toDOMElements);
                    H.replaceMany(currentElements, nextElements);
                    currentElements = nextElements;
                }
            }
            else {
                // Optization idea: different strategy based on count change:
                // newCount==oldCount => replacement strategy (as implemented now)
                // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
                // newCount>oldCount => assume insertion on non-equality                
                if (nextValues.length === 0) {
                    var nextElements = [H.createPlaceholder()]; // TODO: switch unsub
                    H.replaceMany(currentElements, nextElements);
                    currentElements = nextElements;
                }
                else {
                    // 1. replace at common indices
                    for (var i = 0; i < nextValues.length && i < currentValues.length; i++) {
                        var nextItemKey = key(nextValues[i]);
                        if (nextItemKey !== key(currentValues[i])) {
                            //console.log("Replace element for", nextValues[i])
                            var nextElement = renderItem(nextItemKey, nextValues, i);
                            H.replaceElement(currentElements[i], nextElement);
                            currentElements[i] = nextElement;
                        }
                        else {
                            // Key match => no need to replace
                        }
                    }
                    // 2. add/remove nodes
                    if (nextValues.length > currentValues.length) {
                        var prevElement = currentElements[currentElements.length - 1];
                        for (var i = currentValues.length; i < nextValues.length; i++) {
                            var nextItemKey = key(nextValues[i]);
                            var newElement = renderItem(nextItemKey, nextValues, i);
                            H.addAfterElement(prevElement, newElement);
                            prevElement = newElement;
                            currentElements.push(newElement);
                        }
                    }
                    else if (nextValues.length < currentValues.length) {
                        for (var i = nextValues.length; i < currentValues.length; i++) {
                            H.removeElement(currentElements[i]);
                        }
                        currentElements.splice(nextValues.length);
                    }
                }
            }
            currentValues = nextValues;
            try {
                for (var unmounts_1 = __values(unmounts), unmounts_1_1 = unmounts_1.next(); !unmounts_1_1.done; unmounts_1_1 = unmounts_1.next()) {
                    var unmount = unmounts_1_1.value;
                    H.attachOnUnmount(currentElements[0], unmount);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (unmounts_1_1 && !unmounts_1_1.done && (_a = unmounts_1.return)) _a.call(unmounts_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
        H.attachOnUnmount(currentElements[0], unsub);
    });
    return currentElements;
    function renderItem(key, values, index) {
        var result = renderItemRaw(key, values, index);
        if (!(result instanceof Node)) {
            throw Error("Unexpected result from renderItem: " + result);
        }
        return result;
    }
    function renderItemRaw(key, values, index) {
        if ("renderAtom" in props) {
            var nullableAtom_1 = props.atom.view(index);
            var nonNullableAtom = nullableAtom_1.freezeUnless(function (a) { return a !== undefined; });
            var removeItem = function () { return nullableAtom_1.set(undefined); };
            return props.renderAtom(key, nonNullableAtom, removeItem);
        }
        if ("renderObservable" in props) {
            return props.renderObservable(key, observable.map(function (items) { return items[index]; }).filter(function (item) { return item !== undefined; }).skipDuplicates());
        }
        return props.renderItem(values[index]);
    }
}
