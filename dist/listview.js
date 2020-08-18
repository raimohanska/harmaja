import { attachUnsub, createCustomElement, flattenChild, getCurrentValue, removeElement, renderHTML, replaceElement } from "./harmaja";
export function ListView(props) {
    var observable = ("atom" in props) ? props.atom : props.observable;
    var equals = props.equals;
    return createCustomElement(function () {
        // TODO: would work better if could return multiple elements!
        var rootElement = document.createElement("span");
        var currentValues = getCurrentValue(observable);
        for (var i = 0; i < currentValues.length; i++) {
            rootElement.appendChild(itemToNode(currentValues, i));
        }
        var unsub = observable.changes().forEach(function (nextValues) {
            // TODO: different strategy based on count change:
            // newCount==oldCount => replacement strategy (as implemented not)
            // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
            // newCount>oldCount => assume insertion on non-equality
            for (var i = 0; i < nextValues.length; i++) {
                if (i >= rootElement.childNodes.length) {
                    //console.log("Append new element for", nextValues[i])
                    rootElement.appendChild(itemToNode(nextValues, i));
                }
                else if (!equals(nextValues[i], currentValues[i])) {
                    //console.log("Replace element for", nextValues[i])
                    replaceElement(rootElement.childNodes[i], itemToNode(nextValues, i));
                }
                else {
                    //console.log("Keep element for", nextValues[i])
                    // Same item, keep existing element
                }
            }
            for (var i = currentValues.length - 1; i >= nextValues.length; i--) {
                console.log("Remove element for", currentValues[i]);
                removeElement(rootElement.childNodes[i]);
            }
            currentValues = nextValues;
        });
        attachUnsub(rootElement, unsub);
        return rootElement;
        function itemToNode(values, index) {
            var vDomElement = renderItem(values, index);
            var flattened = flattenChild(vDomElement);
            return renderHTML(flattened);
        }
        function renderItem(values, index) {
            if ("renderAtom" in props) {
                var nullableAtom_1 = props.atom.view(index);
                var nonNullableAtom = nullableAtom_1.freezeUnless(function (a) { return a !== undefined; });
                var removeItem = function () { return nullableAtom_1.set(undefined); };
                return props.renderAtom(nonNullableAtom, removeItem);
            }
            if ("renderObservable" in props) {
                return props.renderObservable(observable.map(function (items) { return items[index]; }).skipDuplicates());
            }
            return props.renderItem(values[index]);
        }
    });
}
