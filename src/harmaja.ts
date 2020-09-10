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
export type Callback = () => void

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
            const unsub: any = observable.skipDuplicates().forEach((nextChildren: HarmajaChildOrChildren) => {
                let oldElements = outputElements    
                outputElements = flattenChildren(nextChildren).flatMap(renderChild).flatMap(toDOMElements)                
                if (outputElements.length === 0) {
                    outputElements = [createPlaceholder()]
                }
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

function applyComponentScopeToObservable(value: any) {
    if (value instanceof Bacon.Observable && !(value instanceof Bacon.Bus) && !(isAtom(value))) {
        return value.takeUntil(unmountEvent())
    }
    return value
}

function getTransientState() {
    return transientStateStack[transientStateStack.length - 1]
}

type NodeState = {
    mounted: boolean
    unmounted: boolean
    onUnmounts: Callback[]
    onMounts: Callback[]
}

function getNodeState(node: Node): NodeState {
    let nodeAny = node as any
    if (!nodeAny.__h) {
        nodeAny.__h = {}
    }
    return nodeAny.__h
}

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

export function callOnMounts(element: Node) {    
    //console.log("onMounts in " + debug(element) + " mounted=" + getNodeState(element).mounted)
    let state = getNodeState(element)
    if (state.mounted) {
        return
    }
    if (state.unmounted) {
        throw new Error("Component re-mount not supported")
    }
    
    state.mounted = true
    if (state.onMounts) {
        for (const sub of state.onMounts as Callback[]) {
            sub()
        }
    }

    for (const child of element.childNodes) {
        callOnMounts(child)
    }
}


function callOnUnmounts(element: Node) {
    let state = getNodeState(element)
    if (!state.mounted) {        
        return
    }

    if (state.onUnmounts) {
        for (const unsub of state.onUnmounts as Callback[]) {
            //console.log("Calling unsub in " + debug(element))
            unsub()
        }
    }

    for (const child of element.childNodes) {
        //console.log("Going to child " + debug(child) + " mounted=" + getNodeState(child).mounted)
        callOnUnmounts(child)
    }
    state.mounted = false
    state.unmounted = true
}

function attachOnMount(element: DOMElement, onMount: Callback) {
    if (typeof onMount !== "function") {
        throw Error("not a function: " + onMount);
    }
    let state = getNodeState(element)
    if (!state.onMounts) {
        state.onMounts = []
    }
    state.onMounts.push(onMount)
}
function attachOnUnmount(element: DOMElement, onUnmount: Callback) {
    if (typeof onUnmount !== "function") {
        throw Error("not a function: " + onUnmount);
    }
    let state = getNodeState(element)
    if (!state.onUnmounts) {
        state.onUnmounts = []
    }
    state.onUnmounts.push(onUnmount)
}

function detachOnUnmount(element: DOMElement, onUnmount: Callback) {
    let state = getNodeState(element)
    if (!state.onUnmounts) {
        return
    }
    for (let i = 0; i < state.onUnmounts.length; i++) {
        if (state.onUnmounts[i] === onUnmount) {
            state.onUnmounts.splice(i, 1)
            return
        }
    }
}

function detachOnUnmounts(element: DOMElement): Callback[] {
    let state = getNodeState(element)
    if (!state.onUnmounts) {
        return []
    }
    let unmounts = state.onUnmounts
    delete state.onUnmounts
    return unmounts
}

function replaceElement(oldElement: ChildNode, newElement: DOMElement) {
    let wasMounted = getNodeState(oldElement).mounted
    
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

function addAfterElement(current: ChildNode, next: ChildNode) {
    current.after(next)
    callOnMounts(next)
}

function toDOMElements(elements: HarmajaOutput): DOMElement[] {
    if (elements instanceof Array) return elements.flatMap(toDOMElements)
    return [elements]
}

function removeElement(oldElement: HarmajaOutput) {
    if (oldElement instanceof Array) {
        oldElement.forEach(removeElement)
    } else {
        callOnUnmounts(oldElement)
        oldElement.remove()
    }
}  

function appendElement(rootElement: DOMElement, child: DOMElement) {
    rootElement.appendChild(child)
    if (getNodeState(rootElement).mounted) {
        callOnMounts(child)
    }
}

export function debug(element: Node) {
    if (element instanceof Element) {
        return element.outerHTML;
    } else {
        return element.textContent
    }
}

export const LowLevelApi = {
    createPlaceholder,
    attachOnMount,
    attachOnUnmount,
    detachOnUnmount,
    detachOnUnmounts,
    appendElement,
    removeElement,
    addAfterElement,
    replaceElement,
    replaceMany,
    toDOMElements
}