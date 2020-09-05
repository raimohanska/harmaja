import * as Bacon from "baconjs"
import { isAtom } from "./atom"

export type HarmajaComponent = (props: HarmajaProps) => DOMElement
export type JSXElementType = string | HarmajaComponent

export type HarmajaProps = Record<string, any>
export type HarmajaChild = HarmajaObservableChild | DOMElement | string | number | null
export type HarmajaChildren = (HarmajaChild | HarmajaChildren)[]
export type HarmajaChildOrChildren = HarmajaChild | HarmajaChildren
export type HarmajaObservableChild = Bacon.Property<HarmajaChildOrChildren>
export type HarmajaOutput = DOMElement | HarmajaOutput[] // Can be one or more, but an empty array is not allowed
export type DOMElement = ChildNode


/**
 *  Mounts the given element to the document, replacing the given root element.
 * 
 *  - Causes the component to be activated, i.e. to start listening to observables 
 *  - `onMount` callbacks will be called
 *  - `onMountEvent` will be triggered
 */
export function mount(harmajaElement: HarmajaOutput, root: Element) {
    replaceMany([root], harmajaElement)
}

/**
 *  Unmounts the given element, removing it from the DOM.
 * 
 *  - Causes the component to be deactivated, i.e. to stop listening to observables 
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export function unmount(harmajaElement: HarmajaOutput) {
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
export function createElement(type: JSXElementType, props: HarmajaProps, ...children: HarmajaChildren): HarmajaOutput {
    const flattenedChildren = children.flatMap(flattenChildren)
    if (props && props.children) {
        delete props.children // TODO: ugly hack, occurred in todoapp example
    }
    if (typeof type == "function") {        
        const constructor = type as HarmajaComponent
        transientStateStack.push({})
        const mappedProps = props && Object.fromEntries(Object.entries(props).map(([key, value]) => [key, applyComponentScopeToObservable(value)]))
        const elements = constructor({...mappedProps, children: flattenedChildren})
        const element: DOMElement = elements instanceof Array ? elements[0] : elements
        if (!isDOMElement(element)) {
            if (elements instanceof Array && elements.length == 0) {
                throw new Error("Empty array is not a valid output")
            }
            // Components must return a DOM element. Otherwise we cannot attach mount/unmounts callbacks.
            throw new Error("Expecting an HTML Element or Text node, got " + element)
        }
        const transientState = transientStateStack.pop()!
        for (const callback of transientState.unmountCallbacks || []) {
            attachOnUnmount(element, callback)
        }
        for (const callback of transientState.mountCallbacks || []) {
            attachOnMount(element, callback)
        }
        return elements
    } else if (typeof type == "string") {
        return renderElement(type, props, flattenedChildren)
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

function flattenChildren(child: HarmajaChildOrChildren): HarmajaChild[] {
    if (child instanceof Array) return child.flatMap(flattenChildren)
    return [child]
}

function renderElement(type: string, props: HarmajaProps, children: HarmajaChild[]): DOMElement {
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
    
    (children || []).map(renderChild).flatMap(toDOMElements).forEach(childElement => el.appendChild(childElement))
    return el
}

function createPlaceholder() {
    return document.createTextNode("")
}

function renderChild(child: HarmajaChild): HarmajaOutput {
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(child.toString())
    }
    if (child === null) {
        return createPlaceholder()
    }
    if (child instanceof Bacon.Property) {
        const observable = child as HarmajaObservableChild        
        let outputElements: DOMElement[] = [createPlaceholder()]
        attachOnMount(outputElements[0], () => {
            //console.log("Subscribing in " + debug(element))
            const unsub: any = observable.skipDuplicates().forEach((nextChildren: HarmajaChildOrChildren) => {
                let oldElements = outputElements    
                outputElements = flattenChildren(nextChildren).flatMap(renderChild).flatMap(toDOMElements)                
                if (outputElements.length === 0) {
                    outputElements = [createPlaceholder()]
                }
                //console.log("Replacing (" + (unsub ? "after sub" : "before sub") + ") " + debug(oldElement) + " with " + debug(element) + " mounted=" + (oldElement as any).mounted)                 
                if (unsub) detachOnUnmount(oldElements[0], unsub) // <- attaching unsub to the replaced element instead
                replaceMany(oldElements, outputElements)
                if (unsub) attachOnUnmount(outputElements[0], unsub)
            })
            attachOnUnmount(outputElements[0], unsub)
        })        
        return outputElements
    }    
    if (isDOMElement(child)) {
        return child
    }
    throw Error(child + " is not a valid element")
}

function isDOMElement(child: any): child is DOMElement {
    return child instanceof Element || child instanceof Text
}

function setProp(el: Element, key: string, value: any) {
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

export function callOnMounts(element: Node) {    
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


function callOnUnmounts(element: Node) {
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

function attachOnMount(element: DOMElement, onMount: Callback) {
    if (typeof onMount !== "function") {
        throw Error("not a function: " + onMount);
    }
    let elementAny = element as any
    if (!elementAny.onMounts) {
        elementAny.onMounts = []
    }
    elementAny.onMounts.push(onMount)
}
function attachOnUnmount(element: DOMElement, onUnmount: Callback) {
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

function detachOnUnmount(element: DOMElement, onUnmount: Callback) {
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

function replaceElement(oldElement: ChildNode, newElement: DOMElement) {
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

function replaceMany(oldContent: HarmajaOutput, newContent: HarmajaOutput) {
    const oldNodes = toDOMElements(oldContent)
    const newNodes = toDOMElements(newContent)
    if (oldNodes.length === 0) throw new Error("Cannot replace zero nodes");
    if (newNodes.length === 0) throw new Error("Cannot replace with zero nodes");
    for (let node of oldNodes) {
        callOnUnmounts(node)
    }
    oldNodes[0].parentElement!.replaceChild(newNodes[0], oldNodes[0])
    for (let i = 1; i < oldNodes.length; i++) {
        oldNodes[i].remove()
    }
    for (let i = 1; i < newNodes.length; i++) {
        newNodes[i - 1].after(newNodes[i])
    }
    for (let node of newNodes) {
        callOnMounts(node)
    }
}

function toDOMElements(elements: HarmajaOutput): DOMElement[] {
    if (elements instanceof Array) return elements.flatMap(toDOMElements)
    return [elements]
}

function removeElement(oldElement: HarmajaOutput) {
    //console.log("removeElement " + debug(oldElement) + ", mounted = " + (oldElement as any).mounted);
    if (oldElement instanceof Array) {
        oldElement.forEach(removeElement)
    } else {
        callOnUnmounts(oldElement)
        oldElement.remove()
    }
}  

function appendElement(rootElement: DOMElement, child: DOMElement) {
    rootElement.appendChild(child)
    if ((rootElement as any).mounted) {
        callOnMounts(child)
    }
}

export function debug(element: DOMElement | ChildNode) {
    if (element instanceof Element) {
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