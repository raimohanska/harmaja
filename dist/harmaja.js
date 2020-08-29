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
export function mount(harmajaElement, root) {
    root.parentElement.replaceChild(harmajaElement, root);
    callOnMounts(harmajaElement);
}
var transientStateStack = [];
export function createElement(type, props) {
    var e_1, _a;
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
        var transientState = transientStateStack.pop();
        try {
            for (var _b = __values(transientState.unmountCallbacks || []), _c = _b.next(); !_c.done; _c = _b.next()) {
                var callback = _c.value;
                attachOnUnmount(element, callback);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
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
export function onUnmount(callback) {
    var transientState = getTransientState();
    if (!transientState.unmountCallbacks)
        transientState.unmountCallbacks = [];
    transientState.unmountCallbacks.push(callback);
}
export function unmountEvent() {
    var transientState = getTransientState();
    if (!transientState.unmountE) {
        var event_1 = new Bacon.Bus();
        onUnmount(function () {
            event_1.push();
            event_1.end();
        });
        transientState.unmountE = event_1;
    }
    return transientState.unmountE;
}
function flattenChildren(child) {
    if (child instanceof Array)
        return child.flatMap(flattenChildren);
    return [child];
}
function renderHTMLElement(type, props, children) {
    var e_2, _a, e_3, _b;
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
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_2) throw e_2.error; }
    }
    try {
        for (var _f = __values(children || []), _g = _f.next(); !_g.done; _g = _f.next()) {
            var child = _g.value;
            el.appendChild(renderChild(child));
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
        }
        finally { if (e_3) throw e_3.error; }
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
            var unsub = observable_2.skipDuplicates().forEach(function (nextValue) {
                if (!element_1) {
                    element_1 = renderChild(nextValue);
                }
                else {
                    var oldElement = element_1;
                    element_1 = renderChild(nextValue);
                    //console.log("Replacing", oldElement, "with", element)
                    // TODO: can we handle a case where the observable yields multiple elements? Currently not.
                    //console.log("Replacing element", oldElement)                    
                    detachOnUnmount(oldElement, unsub); // <- attaching unsub to the replaced element instead
                    replaceElement(oldElement, element_1);
                    attachOnUnmount(element_1, unsub);
                }
            });
            attachOnUnmount(element_1, unsub);
        });
        return element_1;
    }
    if (child instanceof HTMLElement || child instanceof Text) {
        return child;
    }
    throw Error(child + " is not a valid element");
}
function setProp(el, key, value) {
    if (key === "ref") {
        if (typeof value !== "function") {
            throw Error("Expecting ref prop to be a function, got " + value);
        }
        value(el);
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
function callOnMounts(element) {
    var e_4, _a, e_5, _b;
    if (element.mounted) {
        return;
    }
    var elementAny = element;
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
    element.mounted = true;
}
function callOnUnmounts(element) {
    var e_6, _a, e_7, _b;
    var elementAny = element;
    if (elementAny.onUnmounts) {
        try {
            for (var _c = __values(elementAny.onUnmounts), _d = _c.next(); !_d.done; _d = _c.next()) {
                var unsub = _d.value;
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
    element.mounted = false;
}
// TODO: separate low-level API
export function attachOnMount(element, onMount) {
    var elementAny = element;
    if (!elementAny.onMounts) {
        elementAny.onMounts = [];
    }
    elementAny.onMounts.push(onMount);
}
export function attachOnUnmount(element, onUnmount) {
    var elementAny = element;
    if (!elementAny.onUnmounts) {
        elementAny.onUnmounts = [];
    }
    elementAny.onUnmounts.push(onUnmount);
}
export function detachOnUnmount(element, onUnmount) {
    var elementAny = element;
    if (!elementAny.onUnmounts) {
        return;
    }
    for (var i = 0; i < elementAny.onUnmounts.length; i++) {
        if (elementAny.onUnmounts[i] === onUnmount) {
            elementAny.onUnmounts.splice(i, 1);
            return;
        }
    }
}
export function replaceElement(oldElement, newElement) {
    var wasMounted = oldElement.mounted;
    if (wasMounted) {
        callOnUnmounts(oldElement);
    }
    if (!oldElement.parentElement) {
        console.warn("Parent element not found for", oldElement, " => fail to replace");
        return;
    }
    oldElement.parentElement.replaceChild(newElement, oldElement);
    if (wasMounted) {
        callOnMounts(newElement);
    }
}
export function removeElement(oldElement) {
    if (oldElement.mounted) {
        callOnUnmounts(oldElement);
    }
    oldElement.remove();
}
export function appendElement(rootElement, child) {
    rootElement.appendChild(child);
    if (rootElement.mounted) {
        callOnMounts(child);
    }
}
