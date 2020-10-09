import * as B from "./eggs/eggs";
import { autoScope } from "./eggs/eggs";
import { LowLevelApi as H } from "./harmaja";
export function ListView(props) {
    var observable = ("atom" in props) ? props.atom : props.observable;
    var _a = props.getKey, key = _a === void 0 ? (function (x) { return x; }) : _a;
    var currentValues = null;
    var options = {
        onReplace: function (oldNodes, newNodes) {
            getSingleNodeOrFail(newNodes); // Verify that a child node is replaced by exactly one child node.
        }
    };
    return H.createController([H.createPlaceholder()], function (controller) { return observable.forEach(function (nextValues) {
        if (!currentValues) {
            if (nextValues.length) {
                var oldElements = controller.currentElements;
                var nextElements = nextValues.map(function (x, i) { return renderItem(key(x), nextValues, i); }).flatMap(H.toDOMNodes);
                H.replaceMany(controller, oldElements, nextElements);
            }
        }
        else {
            // Optization idea: different strategy based on count change:
            // newCount==oldCount => replacement strategy (as implemented now)
            // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
            // newCount>oldCount => assume insertion on non-equality                
            if (nextValues.length === 0) {
                var nextElements = [H.createPlaceholder()];
                var oldElements = controller.currentElements;
                H.replaceMany(controller, oldElements, nextElements);
            }
            else if (currentValues.length === 0) {
                var prevElement = controller.currentElements[0]; // i.e. the placeholder element
                for (var i = 0; i < nextValues.length; i++) {
                    var nextItemKey = key(nextValues[i]);
                    var newElement = renderItem(nextItemKey, nextValues, i);
                    if (i == 0) {
                        H.replaceNode(controller, i, newElement);
                    }
                    else {
                        H.addAfterNode(controller, prevElement, newElement);
                    }
                    prevElement = newElement;
                }
            }
            else {
                // 1. replace at common indices
                for (var i = 0; i < nextValues.length && i < currentValues.length; i++) {
                    var nextItemKey = key(nextValues[i]);
                    if (nextItemKey !== key(currentValues[i])) {
                        //console.log("Replace element for", nextValues[i])
                        var nextElement = renderItem(nextItemKey, nextValues, i);
                        H.replaceNode(controller, i, nextElement);
                    }
                    else {
                        // Key match => no need to replace
                    }
                }
                // 2. add/remove nodes
                if (nextValues.length > currentValues.length) {
                    for (var i = currentValues.length; i < nextValues.length; i++) {
                        var nextItemKey = key(nextValues[i]);
                        var newElement = renderItem(nextItemKey, nextValues, i);
                        H.addAfterNode(controller, controller.currentElements[i - 1], newElement);
                    }
                }
                else if (nextValues.length < currentValues.length) {
                    for (var i = currentValues.length - 1; i >= nextValues.length; i--) {
                        H.removeNode(controller, i, controller.currentElements[i]);
                    }
                }
            }
        }
        currentValues = nextValues;
    }); }, options);
    function getSingleNodeOrFail(rendered) {
        if (rendered instanceof Array) {
            if (rendered.length == 1) {
                rendered = rendered[0];
            }
            else {
                throw Error("Only single-element results supported in ListView. Got " + rendered);
            }
        }
        return rendered;
    }
    function renderItem(key, values, index) {
        var result = renderItemRaw(key, values, index);
        var rendered = H.render(result);
        return getSingleNodeOrFail(rendered);
    }
    function renderItemRaw(key, values, index) {
        if ("renderAtom" in props) {
            var nullableAtom_1 = B.view(props.atom, index);
            var nonNullableAtom = B.filter(nullableAtom_1, function (a) { return a !== undefined; }, autoScope);
            var removeItem = function () { return nullableAtom_1.set(undefined); };
            return props.renderAtom(key, nonNullableAtom, removeItem);
        }
        if ("renderObservable" in props) {
            // TODO: is filter necessary
            // TODO: use pipe
            var mapped = B.map(observable, function (items) { return items[index]; });
            var filtered = B.filter(mapped, function (item) { return item !== undefined; }, autoScope);
            return props.renderObservable(key, filtered);
        }
        return props.renderItem(values[index]);
    }
}
//# sourceMappingURL=listview.js.map