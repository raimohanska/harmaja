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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
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
export function createElement(type, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    if (props && props.children) {
        delete props.children; // TODO: ugly hack, occurred in todoapp example
    }
    var flattenedChildren = children.flatMap(flattenChildren);
    if (typeof type == "function") {
        var constructor = type;
        return constructor(__assign(__assign({}, props), { children: flattenedChildren }));
    }
    else if (typeof type == "string") {
        return { type: type, props: props, children: flattenedChildren };
    }
    else {
        console.error("Unexpected createElement call with arguments", arguments);
        throw Error("Unknown type " + type);
    }
}
function isElement(x) {
    return typeof x === "object" && typeof x.type === "string";
}
// Flattening is traversing the DOM and calling all component elements to render them, 
// while leaving all regular DOM elements (such as h1) as is.
function flattenChildren(child) {
    if (child instanceof Array)
        return child.flatMap(flattenChildren);
    return [flattenChild(child)];
}
export function flattenChild(child) {
    if (typeof child === "string")
        return child;
    if (typeof child === "number")
        return child.toString();
    if (child === null)
        return null;
    if (child instanceof Bacon.Property)
        return child;
    if (isElement(child))
        return flattenElement(child);
    console.error("Unknown child", child);
    throw new Error("Unknown child type");
}
function isCustomElement(e) {
    return e.type === "_custom_";
}
export function flattenElement(e) {
    if (isCustomElement(e)) {
        return e;
    }
    return createElement.apply(void 0, __spread([e.type, e.props], (e.children || [])));
}
// Our custom React interface for JSX
export var React = {
    createElement: createElement
};
// TODO: typings for JSX
export function mount(ve, root) {
    var replacementElement = renderHTML(ve);
    root.parentElement.replaceChild(replacementElement, root);
}
export function renderHTML(ve) {
    var e_1, _a, e_2, _b;
    if (typeof ve === "string" || typeof ve === "number") {
        return document.createTextNode(ve.toString());
    }
    if (ve instanceof Bacon.Property) {
        var observable = ve;
        var currentValue = getCurrentValue(observable);
        var element_1 = renderHTML(flattenChild(currentValue));
        var unsub_1 = observable.skipDuplicates().changes().forEach(function (currentValue) {
            var oldElement = element_1;
            element_1 = renderHTML(flattenChild(currentValue));
            // TODO: can we handle a case where the observable yields multiple elements? Currently not.
            //console.log("Replacing element", oldElement)
            replaceElement(oldElement, element_1);
            attachUnsub(element_1, unsub_1);
        });
        attachUnsub(element_1, unsub_1);
        return element_1;
    }
    if (ve === null) {
        return document.createTextNode("");
    }
    if (isCustomElement(ve)) {
        return ve.renderHTML();
    }
    var el = document.createElement(ve.type);
    var _loop_1 = function (key, value) {
        if (value instanceof Bacon.Property) {
            var observable = value;
            value = getCurrentValue(observable);
            var unsub = observable.skipDuplicates().changes().forEach(function (newValue) {
                setProp(el, key, newValue);
            });
            attachUnsub(el, unsub);
        }
        setProp(el, key, value);
    };
    try {
        for (var _c = __values(Object.entries(ve.props || {})), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = __read(_d.value, 2), key = _e[0], value = _e[1];
            _loop_1(key, value);
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
        for (var _f = __values(ve.children || []), _g = _f.next(); !_g.done; _g = _f.next()) {
            var child = _g.value;
            el.appendChild(renderHTML(child));
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return el;
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
    var e_3, _a, e_4, _b;
    if (element instanceof Text)
        return;
    try {
        for (var _c = __values(element.childNodes), _d = _c.next(); !_d.done; _d = _c.next()) {
            var child = _d.value;
            var elementAny = child;
            if (elementAny.unsubs) {
                try {
                    for (var _e = (e_4 = void 0, __values(elementAny.unsubs)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var unsub = _f.value;
                        unsub();
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
            unsubObservablesInChildElements(child);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_3) throw e_3.error; }
    }
}
export function attachUnsub(element, unsub) {
    var elementAny = element;
    if (!elementAny.unsubs) {
        elementAny.unsubs = [];
    }
    elementAny.unsubs.push(unsub);
}
var valueMissing = {};
// TODO: separate low-level API
export function getCurrentValue(observable) {
    var currentV = valueMissing;
    if (observable.get) {
        currentV = observable.get(); // For Atoms
    }
    else {
        var unsub = observable.onValue(function (v) { return (currentV = v); });
        unsub();
    }
    if (currentV === valueMissing) {
        console.log("Current value not found!", observable);
        throw new Error("Current value missing. Cannot render. " + observable);
    }
    return currentV;
}
;
export function createCustomElement(renderHTML) {
    return {
        key: "",
        type: "_custom_",
        props: {},
        renderHTML: renderHTML
    };
}
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
