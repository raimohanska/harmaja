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
    root.parentElement.replaceChild(harmajaElement, root);
    callOnMounts(harmajaElement);
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
        var element = constructor(__assign(__assign({}, mappedProps), { children: flattenedChildren }));
        if (!isDOMElement(element)) {
            // Components must return a DOM element. Otherwise we cannot attach mount/unmounts callbacks.
            throw new Error("Expecting an HTMLElement or Text node, got " + element);
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
        return element;
    }
    else if (typeof type == "string") {
        return renderHTMLElement(type, props, flattenedChildren);
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
function renderHTMLElement(type, props, children) {
    var e_3, _a, e_4, _b;
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
        for (var _c = __values(Object.entries(props || {})), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = __read(_d.value, 2), key = _e[0], value = _e[1];
            _loop_1(key, value);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_3) throw e_3.error; }
    }
    try {
        for (var _f = __values(children || []), _g = _f.next(); !_g.done; _g = _f.next()) {
            var child = _g.value;
            el.appendChild(renderChild(child));
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
        }
        finally { if (e_4) throw e_4.error; }
    }
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
        var element_1 = createPlaceholder();
        attachOnMount(element_1, function () {
            //console.log("Subscribing in " + debug(element))
            var unsub = observable_2.skipDuplicates().forEach(function (nextValue) {
                if (!element_1) {
                    element_1 = renderChild(nextValue);
                }
                else {
                    var oldElement = element_1;
                    element_1 = renderChild(nextValue);
                    // TODO: can we handle a case where the observable yields multiple elements? Currently not.
                    //console.log("Replacing (" + (unsub ? "after sub" : "before sub") + ") " + debug(oldElement) + " with " + debug(element) + " mounted=" + (oldElement as any).mounted)                 
                    if (unsub)
                        detachOnUnmount(oldElement, unsub); // <- attaching unsub to the replaced element instead
                    replaceElement(oldElement, element_1);
                    if (unsub)
                        attachOnUnmount(element_1, unsub);
                }
            });
            attachOnUnmount(element_1, unsub);
        });
        return element_1;
    }
    if (isDOMElement(child)) {
        return child;
    }
    throw Error(child + " is not a valid element");
}
function isDOMElement(child) {
    return child instanceof HTMLElement || child instanceof Text;
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
    var e_5, _a, e_6, _b;
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
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_5) throw e_5.error; }
        }
    }
    try {
        for (var _e = __values(element.childNodes), _f = _e.next(); !_f.done; _f = _e.next()) {
            var child = _f.value;
            callOnMounts(child);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
        }
        finally { if (e_6) throw e_6.error; }
    }
}
function callOnUnmounts(element) {
    var e_7, _a, e_8, _b;
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
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_7) throw e_7.error; }
        }
    }
    try {
        for (var _e = __values(element.childNodes), _f = _e.next(); !_f.done; _f = _e.next()) {
            var child = _f.value;
            //console.log("Going to child " + debug(child) + " mounted=" + (child as any).mounted)
            callOnUnmounts(child);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
        }
        finally { if (e_8) throw e_8.error; }
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
function removeElement(oldElement) {
    //console.log("removeElement " + debug(oldElement) + ", mounted = " + (oldElement as any).mounted);
    callOnUnmounts(oldElement);
    oldElement.remove();
}
function appendElement(rootElement, child) {
    rootElement.appendChild(child);
    if (rootElement.mounted) {
        callOnMounts(child);
    }
}
export function debug(element) {
    if (element instanceof HTMLElement) {
        return element.outerHTML;
    }
    else {
        return element.textContent;
    }
}
export var LowLevelApi = {
    attachOnMount: attachOnMount,
    attachOnUnmount: attachOnUnmount,
    appendElement: appendElement,
    removeElement: removeElement,
    replaceElement: replaceElement
};
