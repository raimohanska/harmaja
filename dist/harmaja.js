var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
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
import * as Bacon from "baconjs";
import { isAtom } from "./atom";
/**
 *  Mounts the given element to the document, replacing the given root element.
 *
 *  - Causes the component to be activated, i.e. to start listening to observables
 *  - `onMount` callbacks will be called
 *  - `onMountEvent` will be triggered
 */
export function mount(harmajaElement, root) {
    replaceMany([root], harmajaElement);
}
/**
 *  Unmounts the given element, removing it from the DOM.
 *
 *  - Causes the component to be deactivated, i.e. to stop listening to observables
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export function unmount(harmajaElement) {
    removeElement(harmajaElement);
}
var transientStateStack = [];
/**
 *  Element constructor used by JSX.
 */
export function createElement(type, props) {
    var e_1, _a, e_2, _b;
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    var flattenedChildren = children.flatMap(flattenChildren);
    if (props && props.children) {
        delete props.children; // TODO: ugly hack, occurred in todoapp example
    }
    if (typeof type == "function") {
        var constructor = type;
        transientStateStack.push({});
        var mappedProps = props && Object.fromEntries(Object.entries(props).map(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            return [key, applyComponentScopeToObservable(value)];
        }));
        var elements = constructor(__assign(__assign({}, mappedProps), { children: flattenedChildren }));
        var element = elements instanceof Array ? elements[0] : elements;
        if (!isDOMElement(element)) {
            if (elements instanceof Array && elements.length == 0) {
                throw new Error("Empty array is not a valid output");
            }
            // Components must return a DOM element. Otherwise we cannot attach mount/unmounts callbacks.
            throw new Error("Expecting an HTML Element or Text node, got " + element);
        }
        var transientState = transientStateStack.pop();
        try {
            for (var _c = __values(transientState.unmountCallbacks || []), _d = _c.next(); !_d.done; _d = _c.next()) {
                var callback = _d.value;
                attachOnUnmount(element, callback);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var _e = __values(transientState.mountCallbacks || []), _f = _e.next(); !_f.done; _f = _e.next()) {
                var callback = _f.value;
                attachOnMount(element, callback);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return elements;
    }
    else if (typeof type == "string") {
        return renderElement(type, props, flattenedChildren);
    }
    else {
        console.error("Unexpected createElement call with arguments", arguments);
        throw Error("Unknown type " + type);
    }
}
function applyComponentScopeToObservable(value) {
    if (value instanceof Bacon.Observable && !(value instanceof Bacon.Bus) && !(isAtom(value))) {
        return value.takeUntil(unmountEvent());
    }
    return value;
}
function getTransientState() {
    return transientStateStack[transientStateStack.length - 1];
}
/**
 *  Add onMount callback. Called once after the component has been mounted on the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onMount(callback) {
    var transientState = getTransientState();
    if (!transientState.mountCallbacks)
        transientState.mountCallbacks = [];
    transientState.mountCallbacks.push(callback);
}
/**
 *  Add onUnmount callback. Called once after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onUnmount(callback) {
    var transientState = getTransientState();
    if (!transientState.unmountCallbacks)
        transientState.unmountCallbacks = [];
    transientState.unmountCallbacks.push(callback);
}
/**
 *  The onMount event as EventStream, emitting a value after the component has been mounted to the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function mountEvent() {
    var transientState = getTransientState();
    if (!transientState.mountE) {
        var event_1 = new Bacon.Bus();
        onMount(function () {
            event_1.push();
            event_1.end();
        });
        transientState.mountE = event_1;
    }
    return transientState.mountE;
}
/**
 *  The onUnmount event as EventStream, emitting a value after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function unmountEvent() {
    var transientState = getTransientState();
    if (!transientState.unmountE) {
        var event_2 = new Bacon.Bus();
        onUnmount(function () {
            event_2.push();
            event_2.end();
        });
        transientState.unmountE = event_2;
    }
    return transientState.unmountE;
}
function flattenChildren(child) {
    if (child instanceof Array)
        return child.flatMap(flattenChildren);
    return [child];
}
function renderElement(type, props, children) {
    var e_3, _a;
    var el = document.createElement(type);
    var _loop_1 = function (key, value) {
        if (value instanceof Bacon.Property) {
            var observable_1 = value;
            attachOnMount(el, function () {
                var unsub = observable_1.skipDuplicates().forEach(function (nextValue) {
                    setProp(el, key, nextValue);
                });
                attachOnUnmount(el, unsub);
            });
        }
        else {
            setProp(el, key, value);
        }
    };
    try {
        for (var _b = __values(Object.entries(props || {})), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
            _loop_1(key, value);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    (children || []).map(renderChild).flatMap(toDOMElements).forEach(function (childElement) { return el.appendChild(childElement); });
    return el;
}
function createPlaceholder() {
    return document.createTextNode("");
}
function renderChild(child) {
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(child.toString());
    }
    if (child === null) {
        return createPlaceholder();
    }
    if (child instanceof Bacon.Property) {
        var observable_2 = child;
        var outputElements_1 = [createPlaceholder()];
        attachOnMount(outputElements_1[0], function () {
            //console.log("Subscribing in " + debug(element))
            var unsub = observable_2.skipDuplicates().forEach(function (nextChildren) {
                var oldElements = outputElements_1;
                outputElements_1 = flattenChildren(nextChildren).flatMap(renderChild).flatMap(toDOMElements);
                if (outputElements_1.length === 0) {
                    outputElements_1 = [createPlaceholder()];
                }
                //console.log("Replacing (" + (unsub ? "after sub" : "before sub") + ") " + debug(oldElement) + " with " + debug(element) + " mounted=" + (oldElement as any).mounted)                 
                if (unsub)
                    detachOnUnmount(oldElements[0], unsub); // <- attaching unsub to the replaced element instead
                replaceMany(oldElements, outputElements_1);
                if (unsub)
                    attachOnUnmount(outputElements_1[0], unsub);
            });
            attachOnUnmount(outputElements_1[0], unsub);
        });
        return outputElements_1;
    }
    if (isDOMElement(child)) {
        return child;
    }
    throw Error(child + " is not a valid element");
}
function isDOMElement(child) {
    return child instanceof Element || child instanceof Text;
}
function setProp(el, key, value) {
    if (key === "ref") {
        if (typeof value !== "function") {
            throw Error("Expecting ref prop to be a function, got " + value);
        }
        var refFn_1 = value;
        attachOnMount(el, function () { return refFn_1(el); });
        return;
    }
    if (key.startsWith("on")) {
        key = key.toLowerCase();
    }
    if (key === "style") {
        var styles = Object.entries(value)
            .filter(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            return key !== "";
        })
            .map(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            return toKebabCase(key) + ": " + value + ";";
        })
            .join("\n");
        el.setAttribute("style", styles);
    }
    else {
        el[key] = value;
    }
}
function toKebabCase(inputString) {
    return inputString.split('').map(function (character) {
        if (character == character.toUpperCase()) {
            return '-' + character.toLowerCase();
        }
        else {
            return character;
        }
    })
        .join('');
}
export function callOnMounts(element) {
    var e_4, _a, e_5, _b;
    //console.log("onMounts in " + debug(element) + " mounted=" + (element as any).mounted)
    var elementAny = element;
    if (elementAny.mounted) {
        return;
    }
    if (elementAny.unmounted) {
        throw new Error("Component re-mount not supported");
    }
    elementAny.mounted = true;
    if (elementAny.onMounts) {
        try {
            for (var _c = __values(elementAny.onMounts), _d = _c.next(); !_d.done; _d = _c.next()) {
                var sub = _d.value;
                sub();
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_4) throw e_4.error; }
        }
    }
    try {
        for (var _e = __values(element.childNodes), _f = _e.next(); !_f.done; _f = _e.next()) {
            var child = _f.value;
            callOnMounts(child);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
        }
        finally { if (e_5) throw e_5.error; }
    }
}
function callOnUnmounts(element) {
    var e_6, _a, e_7, _b;
    var elementAny = element;
    if (!elementAny.mounted) {
        return;
    }
    if (elementAny.onUnmounts) {
        try {
            for (var _c = __values(elementAny.onUnmounts), _d = _c.next(); !_d.done; _d = _c.next()) {
                var unsub = _d.value;
                //console.log("Calling unsub in " + debug(element))
                unsub();
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_6) throw e_6.error; }
        }
    }
    try {
        for (var _e = __values(element.childNodes), _f = _e.next(); !_f.done; _f = _e.next()) {
            var child = _f.value;
            //console.log("Going to child " + debug(child) + " mounted=" + (child as any).mounted)
            callOnUnmounts(child);
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
        }
        finally { if (e_7) throw e_7.error; }
    }
    elementAny.mounted = false;
    elementAny.unmounted = true;
}
function attachOnMount(element, onMount) {
    if (typeof onMount !== "function") {
        throw Error("not a function: " + onMount);
    }
    var elementAny = element;
    if (!elementAny.onMounts) {
        elementAny.onMounts = [];
    }
    elementAny.onMounts.push(onMount);
}
function attachOnUnmount(element, onUnmount) {
    if (typeof onUnmount !== "function") {
        throw Error("not a function: " + onUnmount);
    }
    //console.log("attachOnUnmount " + (typeof onUnmount) + " to " + debug(element))
    var elementAny = element;
    if (!elementAny.onUnmounts) {
        elementAny.onUnmounts = [];
    }
    elementAny.onUnmounts.push(onUnmount);
}
function detachOnUnmount(element, onUnmount) {
    var elementAny = element;
    if (!elementAny.onUnmounts) {
        return;
    }
    //console.log("detachOnUnmount " + (typeof onUnmount) + " from " + debug(element) + " having " + elementAny.onUnmounts.length + " onUmounts")
    for (var i = 0; i < elementAny.onUnmounts.length; i++) {
        if (elementAny.onUnmounts[i] === onUnmount) {
            //console.log("Actually detaching unmount")
            elementAny.onUnmounts.splice(i, 1);
            return;
        }
        else {
            //console.log("Fn unequal " + elementAny.onUnmounts[i] + "  vs  " + onUnmount)
        }
    }
}
function detachOnUnmounts(element) {
    var elementAny = element;
    if (!elementAny.onUnmounts) {
        return [];
    }
    var unmounts = elementAny.onUnmounts;
    delete elementAny.onUnmounts;
    return unmounts;
}
function replaceElement(oldElement, newElement) {
    var wasMounted = oldElement.mounted;
    if (wasMounted) {
        callOnUnmounts(oldElement);
    }
    if (!oldElement.parentElement) {
        //console.warn("Parent element not found for", oldElement, " => fail to replace")
        return;
    }
    oldElement.parentElement.replaceChild(newElement, oldElement);
    if (wasMounted) {
        callOnMounts(newElement);
    }
}
function replaceMany(oldContent, newContent) {
    var e_8, _a, e_9, _b;
    var oldNodes = toDOMElements(oldContent);
    var newNodes = toDOMElements(newContent);
    if (oldNodes.length === 0)
        throw new Error("Cannot replace zero nodes");
    if (newNodes.length === 0)
        throw new Error("Cannot replace with zero nodes");
    try {
        for (var oldNodes_1 = __values(oldNodes), oldNodes_1_1 = oldNodes_1.next(); !oldNodes_1_1.done; oldNodes_1_1 = oldNodes_1.next()) {
            var node = oldNodes_1_1.value;
            callOnUnmounts(node);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (oldNodes_1_1 && !oldNodes_1_1.done && (_a = oldNodes_1.return)) _a.call(oldNodes_1);
        }
        finally { if (e_8) throw e_8.error; }
    }
    oldNodes[0].parentElement.replaceChild(newNodes[0], oldNodes[0]);
    for (var i = 1; i < oldNodes.length; i++) {
        oldNodes[i].remove();
    }
    for (var i = 1; i < newNodes.length; i++) {
        newNodes[i - 1].after(newNodes[i]);
    }
    try {
        for (var newNodes_1 = __values(newNodes), newNodes_1_1 = newNodes_1.next(); !newNodes_1_1.done; newNodes_1_1 = newNodes_1.next()) {
            var node = newNodes_1_1.value;
            callOnMounts(node);
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (newNodes_1_1 && !newNodes_1_1.done && (_b = newNodes_1.return)) _b.call(newNodes_1);
        }
        finally { if (e_9) throw e_9.error; }
    }
}
function addAfterElement(current, next) {
    current.after(next);
    callOnMounts(next);
}
function toDOMElements(elements) {
    if (elements instanceof Array)
        return elements.flatMap(toDOMElements);
    return [elements];
}
function removeElement(oldElement) {
    //console.log("removeElement " + debug(oldElement) + ", mounted = " + (oldElement as any).mounted);
    if (oldElement instanceof Array) {
        oldElement.forEach(removeElement);
    }
    else {
        callOnUnmounts(oldElement);
        oldElement.remove();
    }
}
function appendElement(rootElement, child) {
    rootElement.appendChild(child);
    if (rootElement.mounted) {
        callOnMounts(child);
    }
}
export function debug(element) {
    if (element instanceof Element) {
        return element.outerHTML;
    }
    else {
        return element.textContent;
    }
}
export var LowLevelApi = {
    createPlaceholder: createPlaceholder,
    attachOnMount: attachOnMount,
    attachOnUnmount: attachOnUnmount,
    detachOnUnmount: detachOnUnmount,
    detachOnUnmounts: detachOnUnmounts,
    appendElement: appendElement,
    removeElement: removeElement,
    addAfterElement: addAfterElement,
    replaceElement: replaceElement,
    replaceMany: replaceMany,
    toDOMElements: toDOMElements
};
