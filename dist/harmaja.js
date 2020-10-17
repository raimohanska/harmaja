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
import * as B from "lonna";
var transientStateStack = [];
/**
 *  Element constructor used by JSX.
 */
export function createElement(type, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    var flattenedChildren = children.flatMap(flattenChildren);
    if (!props) {
        props = {};
    }
    else if (props.children) {
        delete props.children; // TODO: ugly hack, occurred in todoapp example
    }
    if (typeof type == "function") {
        var constructor = type;
        transientStateStack.push({});
        var result = constructor(__assign(__assign({}, props), { children: flattenedChildren }));
        var transientState = transientStateStack.pop();
        if (result instanceof B.Property) {
            return createController([createPlaceholder()], composeControllers(handleMounts(transientState), startUpdatingNodes(result)));
        }
        else if (transientState.unmountCallbacks || transientState.mountCallbacks || transientState.scope) {
            return createController(toDOMNodes(render(result)), handleMounts(transientState));
        }
        else {
            return result;
        }
    }
    else if (typeof type == "string") {
        return renderElement(type, props, flattenedChildren);
    }
    else {
        console.error("Unexpected createElement call with arguments", arguments);
        throw Error("Unknown type " + type);
    }
}
function composeControllers(c1, c2) {
    return function (controller) {
        var unsub1 = c1(controller);
        var unsub2 = c2(controller);
        return function () {
            unsub2();
            unsub1();
        };
    };
}
var handleMounts = function (transientState) { return function (controller) {
    var e_1, _a;
    if (transientState.scope) {
        transientState.mountsController = controller;
    }
    if (transientState.mountCallbacks)
        try {
            for (var _b = __values(transientState.mountCallbacks), _c = _b.next(); !_c.done; _c = _b.next()) {
                var callback = _c.value;
                callback();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    return function () {
        var e_2, _a;
        if (transientState.unmountCallbacks)
            try {
                for (var _b = __values(transientState.unmountCallbacks), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var callback = _c.value;
                    callback();
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
    };
}; };
export function Fragment(_a) {
    var children = _a.children;
    return children.flatMap(flattenChildren).flatMap(render);
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
        if (value instanceof B.Property) {
            var observable_1 = value;
            attachOnMount(el, function () {
                var unsub = observable_1.forEach(function (nextValue) {
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
    (children || []).map(render).flatMap(toDOMNodes).forEach(function (childElement) { return el.appendChild(childElement); });
    return el;
}
function createPlaceholder() {
    var placeholder = document.createTextNode("");
    placeholder._h_id = counter++;
    return placeholder;
}
var counter = 1;
function render(child) {
    if (child instanceof Array) {
        return child.flatMap(render);
    }
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(child.toString());
    }
    if (child === null) {
        return createPlaceholder();
    }
    if (child instanceof B.Property) {
        return createController([createPlaceholder()], startUpdatingNodes(child));
    }
    if (isDOMElement(child)) {
        return child;
    }
    throw Error(child + " is not a valid element");
}
var startUpdatingNodes = function (observable) { return function (controller) {
    return observable.forEach(function (nextChildren) {
        var oldElements = controller.currentElements.slice();
        var newNodes = flattenChildren(nextChildren).flatMap(render).flatMap(toDOMNodes);
        if (newNodes.length === 0) {
            newNodes = [createPlaceholder()];
        }
        //console.log("New values", debug(controller.currentElements))
        //console.log(`${debug(oldElements)} replaced by ${debug(controller.currentElements)} in observable`)
        replaceMany(controller, oldElements, newNodes);
    });
}; };
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
function getTransientState(forMethod) {
    if (transientStateStack.length == 0) {
        throw Error("Illegal " + forMethod + " call outside component constructor call");
    }
    return transientStateStack[transientStateStack.length - 1];
}
function maybeGetNodeState(node) {
    var nodeAny = node;
    return nodeAny.__h;
}
function getNodeState(node) {
    var nodeAny = node;
    if (!nodeAny.__h) {
        var state = {};
        nodeAny.__h = state;
    }
    return nodeAny.__h;
}
/**
 *  Mounts the given element to the document, replacing the given root element.
 *
 *  - Causes the component to be activated, i.e. to start listening to observables
 *  - `onMount` callbacks will be called
 *  - `onMountEvent` will be triggered
 */
export function mount(harmajaElement, root) {
    var rendered = render(harmajaElement);
    replaceMany(null, [root], rendered);
    return rendered;
}
/**
 *  Unmounts the given element, removing it from the DOM.
 *
 *  - Causes the component to be deactivated, i.e. to stop listening to observables
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export function unmount(harmajaElement) {
    if (harmajaElement instanceof B.Property) {
        // A dynamic component, let's try to find the current mounted nodes
        //console.log("Unmounting dynamic", harmajaElement)
        unmount(harmajaElement.get());
    }
    else if (harmajaElement instanceof Array) {
        //console.log("Unmounting array")
        harmajaElement.forEach(unmount);
    }
    else {
        //console.log("Unmounting node", debug(harmajaElement))
        removeNode(null, 0, harmajaElement);
    }
}
/**
 *  Add onMount callback. Called once after the component has been mounted on the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onMount(callback) {
    var transientState = getTransientState("onMount");
    if (!transientState.mountCallbacks)
        transientState.mountCallbacks = [];
    transientState.mountCallbacks.push(callback);
}
/**
 *  Add onUnmount callback. Called once after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onUnmount(callback) {
    var transientState = getTransientState("onUnmount");
    if (!transientState.unmountCallbacks)
        transientState.unmountCallbacks = [];
    transientState.unmountCallbacks.push(callback);
}
/**
 *  The onMount event as EventStream, emitting a value after the component has been mounted to the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function mountEvent() {
    var transientState = getTransientState("mountEvent");
    if (!transientState.mountE) {
        var event_1 = B.bus();
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
    var transientState = getTransientState("unmountEvent");
    if (!transientState.unmountE) {
        var event_2 = B.bus();
        onUnmount(function () {
            event_2.push();
            //event.end()
        });
        transientState.unmountE = event_2;
    }
    return transientState.unmountE;
}
export function componentScope() {
    var transientState = getTransientState("unmountEvent");
    if (!transientState.scope) {
        console.log("create");
        var unmountE_1 = unmountEvent();
        var mountE_1 = mountEvent();
        transientState.scope = { subscribe: function (onIn, dispatcher) {
                console.log("scope");
                var unsub = null;
                unmountE_1.forEach(function () { if (unsub)
                    unsub(); });
                if (transientState.mountsController) {
                    var state = getNodeState(transientState.mountsController.currentElements[0]);
                    console.log("state now", state);
                    if (state.mounted) {
                        unsub = onIn();
                        return;
                    }
                }
                else {
                    console.log("no ctrl");
                }
                mountE_1.forEach(function () {
                    console.log("component scope in");
                    unsub = onIn();
                });
            } };
    }
    return transientState.scope;
}
export function callOnMounts(element) {
    var e_4, _a, e_5, _b;
    //console.log("callOnMounts in " + debug(element) + " mounted=" + getNodeState(element).mounted)
    var state = getNodeState(element);
    if (state.mounted) {
        return;
    }
    if (state.unmounted) {
        throw new Error("Component re-mount not supported");
    }
    state.mounted = true;
    if (state.onMounts) {
        try {
            for (var _c = __values(state.onMounts), _d = _c.next(); !_d.done; _d = _c.next()) {
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
    //console.log("callOnUnmounts " + debug(element))
    var state = getNodeState(element);
    if (!state.mounted) {
        return;
    }
    if (state.onUnmounts) {
        try {
            for (var _c = __values(state.onUnmounts), _d = _c.next(); !_d.done; _d = _c.next()) {
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
            //console.log("Going to child " + debug(child) + " mounted=" + getNodeState(child).mounted)
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
    state.mounted = false;
    state.unmounted = true;
}
function attachOnMount(element, onMount) {
    if (typeof onMount !== "function") {
        throw Error("not a function: " + onMount);
    }
    var state = getNodeState(element);
    if (!state.onMounts) {
        state.onMounts = [];
    }
    state.onMounts.push(onMount);
}
function attachOnUnmount(element, onUnmount) {
    if (typeof onUnmount !== "function") {
        throw Error("not a function: " + onUnmount);
    }
    var state = getNodeState(element);
    if (!state.onUnmounts) {
        state.onUnmounts = [];
    }
    if (state.onUnmounts.includes(onUnmount)) {
        //console.log("Duplicate")
        return;
    }
    state.onUnmounts.push(onUnmount);
}
function detachOnUnmount(element, onUnmount) {
    var state = maybeGetNodeState(element);
    if (state === undefined || !state.onUnmounts) {
        return;
    }
    for (var i = 0; i < state.onUnmounts.length; i++) {
        if (state.onUnmounts[i] === onUnmount) {
            state.onUnmounts.splice(i, 1);
            return;
        }
    }
}
function detachController(oldElements, controller) {
    var e_8, _a;
    var _b;
    try {
        for (var oldElements_1 = __values(oldElements), oldElements_1_1 = oldElements_1.next(); !oldElements_1_1.done; oldElements_1_1 = oldElements_1.next()) {
            var el = oldElements_1_1.value;
            var state = getNodeState(el);
            //console.log("Detach controller from " + debug(el))
            var index = (_b = state.controllers) === null || _b === void 0 ? void 0 : _b.indexOf(controller);
            if (index === undefined || index < 0) {
                throw Error("Controller not attached to " + el);
            }
            // Not removing controller from list. Even though the element is discarded, it's still not ok to
            // attach other controllers to it.        
            if (controller.unsub)
                detachOnUnmount(el, controller.unsub);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (oldElements_1_1 && !oldElements_1_1.done && (_a = oldElements_1.return)) _a.call(oldElements_1);
        }
        finally { if (e_8) throw e_8.error; }
    }
}
function createController(elements, bootstrap, options) {
    var controller = __assign(__assign({}, options), { currentElements: elements });
    attachController(elements, controller, bootstrap);
    return elements;
}
function attachController(elements, controller, bootstrap) {
    var _loop_2 = function (i) {
        var el = elements[i];
        var state = getNodeState(el);
        // Checking for double controllers    
        if (!state.controllers) {
            state.controllers = [controller];
            //console.log("Attach first controller to " + debug(el) + " (now with " + state.controllers.length + ")")
        }
        else if (state.controllers.includes(controller)) {
            //console.log("Skip duplicate controller to " + debug(el) + " (now with " + state.controllers.length + ")")
        }
        else {
            state.controllers.push(controller);
            //console.log("Attach controller to " + debug(el) + " (now with " + state.controllers.length + ")")
        }
        // Sub/unsub logic                
        if (i == 0) {
            if (bootstrap) {
                if (state.mounted) {
                    throw Error("Unexpected: Component already mounted");
                }
                else {
                    attachOnMount(el, function () {
                        var unsub = bootstrap(controller);
                        controller.unsub = unsub;
                        el = controller.currentElements[0]; // may have changed in bootstrap!                        
                        attachOnUnmount(el, controller.unsub);
                    });
                }
            }
            if (controller.unsub) {
                attachOnUnmount(el, controller.unsub);
            }
        }
    };
    for (var i = 0; i < elements.length; i++) {
        _loop_2(i);
    }
}
// When some elements are replaced externally (i.e. by their own controllers) we have to do some bookkeeping.
function replacedExternally(controller, oldNodes, newNodes) {
    var e_9, _a;
    //console.log(`Moving controller ${controller} from ${debug(oldNodes)} to ${debug(newNodes)}. Currently has elements ${debug(controller.currentElements)}`)
    var firstIndex = -1;
    var lastIndex = -1;
    if (oldNodes.length === 0)
        throw Error("Empty list of nodes");
    try {
        for (var oldNodes_1 = __values(oldNodes), oldNodes_1_1 = oldNodes_1.next(); !oldNodes_1_1.done; oldNodes_1_1 = oldNodes_1.next()) {
            var oldNode = oldNodes_1_1.value;
            var index = controller.currentElements.indexOf(oldNode);
            if (index < 0) {
                throw Error("Element not found: " + debug(oldNode));
            }
            if (lastIndex >= 0 && index != lastIndex + 1) {
                throw Error("Non-consecutive nodes " + oldNodes);
            }
            if (firstIndex < 0) {
                firstIndex = index;
            }
            lastIndex = index;
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (oldNodes_1_1 && !oldNodes_1_1.done && (_a = oldNodes_1.return)) _a.call(oldNodes_1);
        }
        finally { if (e_9) throw e_9.error; }
    }
    if (firstIndex < 0 || lastIndex < 0)
        throw Error("Assertion failed");
    if (controller.onReplace) {
        controller.onReplace(oldNodes, newNodes);
    }
    detachController(oldNodes, controller);
    controller.currentElements = __spread(controller.currentElements.slice(0, firstIndex), newNodes, controller.currentElements.slice(lastIndex + 1));
    attachController(controller.currentElements, controller);
    //console.log(`Moved controller ${controller} from ${debug(oldNodes)} to ${debug(newNodes)}. Now has elements ${debug(controller.currentElements)}`)
}
function replacedByController(controller, oldNodes, newNodes) {
    var e_10, _a;
    if (!controller)
        return;
    // Controllers are in leaf-to-root order (because leaf controllers are added first)
    var controllers = getNodeState(oldNodes[0]).controllers;
    if (!controllers)
        throw new Error("Assertion failed: Controllers not found for " + debug(oldNodes[0]));
    var index = controllers.indexOf(controller);
    //console.log(`${debug(oldNodes)} replaced by ${debug(newNodes)} controller ${index} of ${controllers.length}`)
    var parentControllers = controllers.slice(index + 1);
    for (var i = 1; i < oldNodes.length; i++) {
        var controllersHere = (getNodeState(oldNodes[i]).controllers || []);
        var indexHere = controllersHere.indexOf(controller);
        if (indexHere < 0) {
            throw new Error("Controller " + controller + " not found in " + debug(oldNodes[i]));
        }
        var parentControllersHere = controllersHere.slice(indexHere + 1);
        if (!arrayEq(parentControllers, parentControllersHere)) {
            throw new Error("Assertion failed: controller array of " + debug(oldNodes[i]) + " (" + controllersHere + ", replacer index " + indexHere + ") not equal to that of " + debug(oldNodes[0]) + " (" + controllers + ").");
        }
    }
    try {
        // We need to replace the upper controllers
        for (var parentControllers_1 = __values(parentControllers), parentControllers_1_1 = parentControllers_1.next(); !parentControllers_1_1.done; parentControllers_1_1 = parentControllers_1.next()) {
            var parentController = parentControllers_1_1.value;
            replacedExternally(parentController, oldNodes, newNodes);
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (parentControllers_1_1 && !parentControllers_1_1.done && (_a = parentControllers_1.return)) _a.call(parentControllers_1);
        }
        finally { if (e_10) throw e_10.error; }
    }
}
function appendedByController(controller, cursorNode, newNode) {
    var e_11, _a;
    if (!controller)
        return;
    // Controllers are in leaf-to-root order (because leaf controllers are added first)
    var controllers = getNodeState(cursorNode).controllers;
    if (!controllers)
        throw new Error("Assertion failed: Controllers not found for " + debug(cursorNode));
    var index = controllers.indexOf(controller);
    if (index < 0) {
        throw new Error("Controller " + controller + " not found in " + debug(cursorNode));
    }
    //console.log(`${debug(newNode)} added after ${debug(cursorNode)} by controller ${index} of ${controllers.length}`)
    var parentControllers = controllers.slice(index + 1);
    try {
        // We need to replace the upper controllers
        for (var parentControllers_2 = __values(parentControllers), parentControllers_2_1 = parentControllers_2.next(); !parentControllers_2_1.done; parentControllers_2_1 = parentControllers_2.next()) {
            var parentController = parentControllers_2_1.value;
            var indexForCursor = parentController.currentElements.indexOf(cursorNode);
            if (indexForCursor < 0) {
                throw new Error("Element " + debug(cursorNode) + " not found in node list of Controller " + parentController + " not found in ");
            }
            parentController.currentElements.splice(indexForCursor + 1, 0, newNode);
            attachController([newNode], parentController);
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (parentControllers_2_1 && !parentControllers_2_1.done && (_a = parentControllers_2.return)) _a.call(parentControllers_2);
        }
        finally { if (e_11) throw e_11.error; }
    }
}
function arrayEq(xs, ys) {
    if (xs.length !== ys.length)
        return false;
    for (var i = 0; i < xs.length; i++) {
        if (xs[i] !== ys[i])
            return false;
    }
    return true;
}
function replaceNode(controller, index, newNode) {
    var _a;
    var oldNode = controller.currentElements[index];
    controller.currentElements[index] = newNode;
    detachController([oldNode], controller);
    attachController([newNode], controller);
    var wasMounted = (_a = maybeGetNodeState(oldNode)) === null || _a === void 0 ? void 0 : _a.mounted;
    if (wasMounted) {
        callOnUnmounts(oldNode);
    }
    if (!oldNode.parentElement) {
        //console.warn("Parent element not found for", oldElement, " => fail to replace")
        return;
    }
    oldNode.parentElement.replaceChild(newNode, oldNode);
    //console.log("Replaced " + debug(oldElement) + " with " + debug(newElement) + " wasMounted=" + wasMounted)
    replacedByController(controller, [oldNode], [newNode]);
    if (wasMounted) {
        callOnMounts(newNode);
    }
}
function replaceMany(controller, oldContent, newContent) {
    var e_12, _a, e_13, _b;
    var oldNodes = toDOMNodes(oldContent);
    var newNodes = toDOMNodes(newContent);
    if (controller) {
        controller.currentElements = newNodes;
        detachController(oldNodes, controller);
        attachController(newNodes, controller);
    }
    if (oldNodes.length === 0)
        throw new Error("Cannot replace zero nodes");
    if (newNodes.length === 0)
        throw new Error("Cannot replace with zero nodes");
    oldNodes[0].parentElement.replaceChild(newNodes[0], oldNodes[0]);
    for (var i = 1; i < oldNodes.length; i++) {
        oldNodes[i].remove();
    }
    for (var i = 1; i < newNodes.length; i++) {
        newNodes[i - 1].after(newNodes[i]);
    }
    replacedByController(controller, oldNodes, newNodes);
    try {
        for (var oldNodes_2 = __values(oldNodes), oldNodes_2_1 = oldNodes_2.next(); !oldNodes_2_1.done; oldNodes_2_1 = oldNodes_2.next()) {
            var node = oldNodes_2_1.value;
            callOnUnmounts(node);
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (oldNodes_2_1 && !oldNodes_2_1.done && (_a = oldNodes_2.return)) _a.call(oldNodes_2);
        }
        finally { if (e_12) throw e_12.error; }
    }
    try {
        for (var newNodes_1 = __values(newNodes), newNodes_1_1 = newNodes_1.next(); !newNodes_1_1.done; newNodes_1_1 = newNodes_1.next()) {
            var node = newNodes_1_1.value;
            callOnMounts(node);
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (newNodes_1_1 && !newNodes_1_1.done && (_b = newNodes_1.return)) _b.call(newNodes_1);
        }
        finally { if (e_13) throw e_13.error; }
    }
    //console.log("Replaced " + debug(oldContent) + " with " + debug(newContent))
}
function addAfterNode(controller, current, next) {
    controller.currentElements.push(next);
    attachController([next], controller);
    current.after(next);
    appendedByController(controller, current, next);
    callOnMounts(next);
}
function toDOMNodes(elements) {
    if (elements instanceof Array)
        return elements.flatMap(toDOMNodes);
    return [elements];
}
function removeNode(controller, index, oldNode) {
    var e_14, _a;
    if (oldNode instanceof Array) {
        if (controller)
            throw Error("Only single node supported with controller option");
        try {
            for (var oldNode_1 = __values(oldNode), oldNode_1_1 = oldNode_1.next(); !oldNode_1_1.done; oldNode_1_1 = oldNode_1.next()) {
                var node = oldNode_1_1.value;
                removeNode(controller, index, node);
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (oldNode_1_1 && !oldNode_1_1.done && (_a = oldNode_1.return)) _a.call(oldNode_1);
            }
            finally { if (e_14) throw e_14.error; }
        }
    }
    else {
        if (controller) {
            controller.currentElements.splice(index, 1);
            detachController([oldNode], controller);
        }
        callOnUnmounts(oldNode);
        oldNode.remove();
        replacedByController(controller, [oldNode], []);
        //console.log("Removed " + debug(oldElement))
    }
}
function appendNode(rootElement, child) {
    var _a;
    rootElement.appendChild(child);
    if ((_a = maybeGetNodeState(rootElement)) === null || _a === void 0 ? void 0 : _a.mounted) {
        callOnMounts(child);
    }
}
export function debug(element) {
    if (element instanceof Array) {
        return element.map(debug).join(",");
    }
    else if (element instanceof Element) {
        return element.outerHTML;
    }
    else {
        return element.textContent || (element._h_id != undefined ? "<placeholder " + element._h_id + ">" : "<empty text node>");
    }
}
export var LowLevelApi = {
    createPlaceholder: createPlaceholder,
    attachOnMount: attachOnMount,
    attachOnUnmount: attachOnUnmount,
    createController: createController,
    appendNode: appendNode,
    removeNode: removeNode,
    addAfterNode: addAfterNode,
    replaceNode: replaceNode,
    replaceMany: replaceMany,
    toDOMNodes: toDOMNodes,
    render: render
};
//# sourceMappingURL=harmaja.js.map