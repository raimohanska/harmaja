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
import { reportValueMissing, valueMissing } from "./utilities";
export function mount(ve, root) {
    root.parentElement.replaceChild(ve, root);
}
var unmountCallbacks = [];
var unmountE = null;
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
        unmountCallbacks = [];
        unmountE = null;
        // TODO: test unmount callbacks, observable scoping
        var mappedProps = props && Object.fromEntries(Object.entries(props).map(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            return [key, applyComponentScopeToObservable(value)];
        }));
        var element = constructor(__assign(__assign({}, mappedProps), { children: flattenedChildren }));
        try {
            for (var unmountCallbacks_1 = __values(unmountCallbacks), unmountCallbacks_1_1 = unmountCallbacks_1.next(); !unmountCallbacks_1_1.done; unmountCallbacks_1_1 = unmountCallbacks_1.next()) {
                var callback = unmountCallbacks_1_1.value;
                attachUnsub(element, callback);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (unmountCallbacks_1_1 && !unmountCallbacks_1_1.done && (_a = unmountCallbacks_1.return)) _a.call(unmountCallbacks_1);
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
export function onUnmount(callback) {
    unmountCallbacks.push(callback);
}
export function unmountEvent() {
    if (!unmountE) {
        var event_1 = new Bacon.Bus();
        onUnmount(function () {
            event_1.push();
            event_1.end();
        });
        unmountE = event_1;
    }
    return unmountE;
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
            var observable = value;
            value = valueMissing;
            var unsub = observable.skipDuplicates().subscribeInternal(function (event) {
                if (Bacon.hasValue(event)) {
                    value = event.value;
                    setProp(el, key, event.value);
                }
            });
            if (value === valueMissing) {
                unsub();
                reportValueMissing(observable);
            }
            attachUnsub(el, unsub);
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
function renderChild(ve) {
    if (typeof ve === "string" || typeof ve === "number") {
        return document.createTextNode(ve.toString());
    }
    if (ve === null) {
        return document.createTextNode("");
    }
    if (ve instanceof Bacon.Property) {
        var observable = ve;
        var element_1 = null;
        var unsub_1 = observable.skipDuplicates().subscribeInternal(function (event) {
            if (Bacon.hasValue(event)) {
                if (!element_1) {
                    element_1 = renderChild(event.value);
                }
                else {
                    var oldElement = element_1;
                    element_1 = renderChild(event.value);
                    // TODO: can we handle a case where the observable yields multiple elements? Currently not.
                    //console.log("Replacing element", oldElement)
                    replaceElement(oldElement, element_1);
                    attachUnsub(element_1, unsub_1);
                }
            }
        });
        if (!element_1) {
            unsub_1();
            reportValueMissing(observable);
        }
        attachUnsub(element_1, unsub_1);
        return element_1;
    }
    return ve;
}
function setProp(el, key, value) {
    if (key.startsWith("on")) {
        key = key.toLowerCase();
    }
    else if (key === "className") {
        key = "class";
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
function unsubObservablesInChildElements(element) {
    var e_4, _a, e_5, _b;
    if (element instanceof Text)
        return;
    try {
        for (var _c = __values(element.childNodes), _d = _c.next(); !_d.done; _d = _c.next()) {
            var child = _d.value;
            var elementAny = child;
            if (elementAny.unsubs) {
                try {
                    for (var _e = (e_5 = void 0, __values(elementAny.unsubs)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var unsub = _f.value;
                        unsub();
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
            unsubObservablesInChildElements(child);
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
export function attachUnsub(element, unsub) {
    var elementAny = element;
    if (!elementAny.unsubs) {
        elementAny.unsubs = [];
    }
    elementAny.unsubs.push(unsub);
}
// TODO: separate low-level API
export function replaceElement(oldElement, newElement) {
    unsubObservablesInChildElements(oldElement);
    if (!oldElement.parentElement) {
        return;
    }
    oldElement.parentElement.replaceChild(newElement, oldElement);
}
export function removeElement(oldElement) {
    unsubObservablesInChildElements(oldElement);
    oldElement.remove();
}
