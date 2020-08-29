import * as Bacon from "baconjs"
import { isAtom } from "./atom"

export type HarmajaComponent = (props: HarmajaProps) => DOMElement
export type JSXElementType = string | HarmajaComponent

export type HarmajaProps = Record<string, any>
export type HarmajaChild = HarmajaObservableChild | DOMElement | string | number | null
export type HarmajaObservableChild = Bacon.Property<HarmajaChild>

export type DOMElement = HTMLElement | Text


/**
 *  Mounts the given element to the document, replacing the given root element.
 * 
 *  - Causes the component to be activated, i.e. to start listening to observables 
 *  - `onMount` callbacks will be called
 *  - `onMountEvent` will be triggered
 */
export function mount(harmajaElement: DOMElement, root: HTMLElement) {
    root.parentElement!.replaceChild(harmajaElement, root)
    callOnMounts(harmajaElement)
}

/**
 *  Unmounts the given element, removing it from the DOM.
 * 
 *  - Causes the component to be deactivated, i.e. to stop listening to observables 
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export function unmount(harmajaElement: DOMElement) {
    removeElement(harmajaElement)
}

type Callback = () => void

let transientStateStack: TransientState[] = []
type TransientState = { 
    mountCallbacks?: Callback[], 
    mountE?: Bacon.EventStream<void>,
    unmountCallbacks?: Callback[], 
    unmountE?: Bacon.EventStream<void>,
}

/**
 *  Element constructor used by JSX.
 */
export function createElement(type: JSXElementType, props: HarmajaProps, ...children: (HarmajaChild | HarmajaChild[])[]): DOMElement {
    const flattenedChildren = children.flatMap(flattenChildren)
    if (props && props.children) {
        delete props.children // TODO: ugly hack, occurred in todoapp example
    }
    if (typeof type == "function") {        
        const constructor = type as HarmajaComponent
        transientStateStack.push({})
        const mappedProps = props && Object.fromEntries(Object.entries(props).map(([key, value]) => [key, applyComponentScopeToObservable(value)]))
        const element = constructor({...mappedProps, children: flattenedChildren})
        if (!isDOMElement(element)) {
            // Components must return a DOM element. Otherwise we cannot attach mount/unmounts callbacks.
            throw new Error("Expecting an HTMLElement or Text node, got " + element)
        }
        const transientState = transientStateStack.pop()!
        for (const callback of transientState.unmountCallbacks || []) {
            attachOnUnmount(element, callback)
        }
        for (const callback of transientState.mountCallbacks || []) {
            attachOnMount(element, callback)
        }
        return element
    } else if (typeof type == "string") {
        return renderHTMLElement(type, props, flattenedChildren)
    } else {
        console.error("Unexpected createElement call with arguments", arguments)
        throw Error(`Unknown type ${type}`)
    }
}

function applyComponentScopeToObservable(value: any) {
    if (value instanceof Bacon.Observable && !(value instanceof Bacon.Bus) && !(isAtom(value))) {
        return value.takeUntil(unmountEvent())
    }
    return value
}

function getTransientState() {
    return transientStateStack[transientStateStack.length - 1]
}

/**
 *  Add onMount callback. Called once after the component has been mounted on the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onMount(callback: Callback) {
    const transientState = getTransientState()
    if (!transientState.mountCallbacks) transientState.mountCallbacks = []
    transientState.mountCallbacks.push(callback)
}

/**
 *  Add onUnmount callback. Called once after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onUnmount(callback: Callback) {
    const transientState = getTransientState()
    if (!transientState.unmountCallbacks) transientState.unmountCallbacks = []
    transientState.unmountCallbacks.push(callback)
}

/**
 *  The onMount event as EventStream, emitting a value after the component has been mounted to the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function mountEvent(): Bacon.EventStream<void> {
    const transientState = getTransientState()
    if (!transientState.mountE) {
        const event = new Bacon.Bus<void>()
        onMount(() => {
            event.push()
            event.end()
        })    
        transientState.mountE = event
    }
    return transientState.mountE
}

/**
 *  The onUnmount event as EventStream, emitting a value after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function unmountEvent(): Bacon.EventStream<void> {
    const transientState = getTransientState()
    if (!transientState.unmountE) {
        const event = new Bacon.Bus<void>()
        onUnmount(() => {
            event.push()
            event.end()
        })    
        transientState.unmountE = event
    }
    return transientState.unmountE
}

function flattenChildren(child: HarmajaChild | HarmajaChild[]): HarmajaChild[] {
    if (child instanceof Array) return child.flatMap(flattenChildren)
    return [child]
}

function renderHTMLElement(type: string, props: HarmajaProps, children: HarmajaChild[]): HTMLElement {
    const el = document.createElement(type)
    for (let [key, value] of Object.entries(props || {})) {
        if (value instanceof Bacon.Property) {
            const observable: Bacon.Property<string> = value            
            attachOnMount(el, () => {
                const unsub = observable.skipDuplicates().forEach(nextValue => {
                    setProp(el, key, nextValue)        
                })
                attachOnUnmount(el, unsub)    
            })
        } else {
            setProp(el, key, value)        
        }
    }
    
    for (const child of children || []) {
        el.appendChild(renderChild(child))
    }
    return el
}

function createPlaceholder() {
    return document.createTextNode("")
}

function renderChild(child: HarmajaChild): DOMElement {
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(child.toString())
    }
    if (child === null) {
        return createPlaceholder()
    }
    if (child instanceof Bacon.Property) {
        const observable = child as HarmajaObservableChild        
        let element: DOMElement = createPlaceholder()
        attachOnMount(element, () => {
            //console.log("Subscribing in " + debug(element))
            const unsub: any = observable.skipDuplicates().forEach(nextValue => {
                if (!element) {
                    element = renderChild(nextValue)
                } else {
                    let oldElement = element
                    element = renderChild(nextValue)
                    // TODO: can we handle a case where the observable yields multiple elements? Currently not.
                    //console.log("Replacing (" + (unsub ? "after sub" : "before sub") + ") " + debug(oldElement) + " with " + debug(element) + " mounted=" + (oldElement as any).mounted)                 
                    if (unsub) detachOnUnmount(oldElement, unsub) // <- attaching unsub to the replaced element instead
                    replaceElement(oldElement, element)
                    if (unsub) attachOnUnmount(element, unsub)
                } 
            })
            attachOnUnmount(element, unsub)
        })        
        return element
    }
    if (isDOMElement(child)) {
        return child
    }
    throw Error(child + " is not a valid element")
}

function isDOMElement(child: any): child is DOMElement {
    return child instanceof HTMLElement || child instanceof Text
}

function setProp(el: HTMLElement, key: string, value: any) {
    if (key === "ref") {
        if (typeof value !== "function") {
            throw Error("Expecting ref prop to be a function, got " + value)
        }
        const refFn = value as Function
        attachOnMount(el, () => refFn(el))
        return
    }
    if (key.startsWith("on")) {
        key = key.toLowerCase()
    }           
    if (key === "style") {
        const styles = Object.entries(value)
            .filter(([key, value]) => key !== "")
            .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
            .join("\n")
        el.setAttribute("style", styles)
    } else {
        (el as any)[key] = value;
    }
}

function toKebabCase(inputString: string) {
    return inputString.split('').map((character) => {
        if (character == character.toUpperCase()) {
            return '-' + character.toLowerCase();
        } else {
            return character;
        }
    })
    .join('');
}

export function callOnMounts(element: Element | Text | ChildNode) {    
    //console.log("onMounts in " + debug(element) + " mounted=" + (element as any).mounted)
    let elementAny = element as any
    if (elementAny.mounted) {
        return
    }
    if (elementAny.unmounted) {
        throw new Error("Component re-mount not supported")
    }
    
    elementAny.mounted = true
    if (elementAny.onMounts) {
        for (const sub of elementAny.onMounts as Callback[]) {
            sub()
        }
    }

    for (const child of element.childNodes) {
        callOnMounts(child)
    }
}


function callOnUnmounts(element: Element | Text | ChildNode) {
    let elementAny = element as any
    if (!elementAny.mounted) {        
        return
    }

    if (elementAny.onUnmounts) {
        for (const unsub of elementAny.onUnmounts as Callback[]) {
            //console.log("Calling unsub in " + debug(element))
            unsub()
        }
    }

    for (const child of element.childNodes) {
        //console.log("Going to child " + debug(child) + " mounted=" + (child as any).mounted)
        callOnUnmounts(child)
    }
    elementAny.mounted = false
    elementAny.unmounted = true
}

function attachOnMount(element: HTMLElement | Text, onMount: Callback) {
    if (typeof onMount !== "function") {
        throw Error("not a function: " + onMount);
    }
    let elementAny = element as any
    if (!elementAny.onMounts) {
        elementAny.onMounts = []
    }
    elementAny.onMounts.push(onMount)
}
function attachOnUnmount(element: HTMLElement | Text, onUnmount: Callback) {
    if (typeof onUnmount !== "function") {
        throw Error("not a function: " + onUnmount);
    }
    //console.log("attachOnUnmount " + (typeof onUnmount) + " to " + debug(element))
    let elementAny = element as any
    if (!elementAny.onUnmounts) {
        elementAny.onUnmounts = []
    }
    elementAny.onUnmounts.push(onUnmount)
}

function detachOnUnmount(element: HTMLElement | Text, onUnmount: Callback) {
    let elementAny = element as any
    if (!elementAny.onUnmounts) {
        return
    }
    //console.log("detachOnUnmount " + (typeof onUnmount) + " from " + debug(element) + " having " + elementAny.onUnmounts.length + " onUmounts")
    
    for (let i = 0; i < elementAny.onUnmounts.length; i++) {
        if (elementAny.onUnmounts[i] === onUnmount) {
            //console.log("Actually detaching unmount")
            elementAny.onUnmounts.splice(i, 1)
            return
        } else {
            //console.log("Fn unequal " + elementAny.onUnmounts[i] + "  vs  " + onUnmount)
        }
    }
}

function replaceElement(oldElement: ChildNode, newElement: HTMLElement | Text) {
    let wasMounted = (oldElement as any).mounted
    
    if (wasMounted) {
        callOnUnmounts(oldElement)
    }
    if (!oldElement.parentElement) {
        //console.warn("Parent element not found for", oldElement, " => fail to replace")
        return
    }
    oldElement.parentElement.replaceChild(newElement, oldElement)
    if (wasMounted) {
        callOnMounts(newElement)
    }
}

function removeElement(oldElement: ChildNode) {
    //console.log("removeElement " + debug(oldElement) + ", mounted = " + (oldElement as any).mounted);
    callOnUnmounts(oldElement)
    oldElement.remove()
}  

function appendElement(rootElement: HTMLElement, child: DOMElement) {
    rootElement.appendChild(child)
    if ((rootElement as any).mounted) {
        callOnMounts(child)
    }
}

export function debug(element: DOMElement | ChildNode) {
    if (element instanceof HTMLElement) {
        return element.outerHTML;
    } else {
        return element.textContent
    }
}

export const LowLevelApi = {
    attachOnMount,
    attachOnUnmount,
    appendElement,
    removeElement,
    replaceElement
}