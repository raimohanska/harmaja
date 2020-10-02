import * as Bacon from "baconjs"
import { isAtom } from "./atom"

export type HarmajaComponent = (props: HarmajaProps) => DOMNode
export type JSXElementType = string | HarmajaComponent

export type HarmajaProps = Record<string, any>
export type HarmajaChild = HarmajaObservableChild | DOMNode | string | number | null
export type HarmajaChildren = (HarmajaChild | HarmajaChildren)[]
export type HarmajaChildOrChildren = HarmajaChild | HarmajaChildren
export type HarmajaObservableChild = Bacon.Property<HarmajaChildOrChildren>
export type HarmajaOutput = DOMNode | HarmajaOutput[] // Can be one or more, but an empty array is not allowed
export type DOMNode = ChildNode

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
        const elements = constructor({...props, children: flattenedChildren})
        const element: DOMNode = elements instanceof Array ? elements[0] : elements
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

function renderElement(type: string, props: HarmajaProps, children: HarmajaChild[]): DOMNode {
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
    
    (children || []).map(renderChild).flatMap(toDOMNodes).forEach(childElement => el.appendChild(childElement))
    return el
}

function createPlaceholder() {
    const placeholder = document.createTextNode("");
    (placeholder as any)._h_id = counter++;
    return placeholder
}

let counter = 1

function renderChild(child: HarmajaChild): HarmajaOutput {
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(child.toString())
    }
    if (child === null) {
        return createPlaceholder()
    }
    if (child instanceof Bacon.Property) {
        const observable = child as HarmajaObservableChild        
        let replaced = false
        return createController([createPlaceholder()], (controller) => observable.skipDuplicates().forEach((nextChildren: HarmajaChildOrChildren) => {
            replaced = true
            let oldElements = controller.currentElements    
            let newNodes = flattenChildren(nextChildren).flatMap(renderChild).flatMap(toDOMNodes)                
            if (newNodes.length === 0) {
                newNodes = [createPlaceholder()]
            }
            //console.log("New values", debug(controller.currentElements))
            //console.log(`${debug(oldElements)} replaced by ${debug(controller.currentElements)} in observable`)
            
            replaceMany(controller, oldElements, newNodes)
        }))
    }    
    if (isDOMElement(child)) {
        return child
    }
    throw Error(child + " is not a valid element")
}



function isDOMElement(child: any): child is DOMNode {
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

function getTransientState(forMethod: string) {
    if (transientStateStack.length == 0) {
        throw Error(`Illegal ${forMethod} call outside component constructor call`)
    }
    return transientStateStack[transientStateStack.length - 1]
}

export type Callback = () => void

type NodeState = {
    mounted?: boolean
    unmounted?: boolean
    onUnmounts?: Callback[]
    onMounts?: Callback[],
    controllers?: NodeController[]
}

export type NodeController = {
    unsub?: Callback,
    currentElements: DOMNode[]
}

function maybeGetNodeState(node: Node): NodeState | undefined {
    let nodeAny = node as any
    return nodeAny.__h
}

function getNodeState(node: Node): NodeState {
    let nodeAny = node as any
    if (!nodeAny.__h) {
        const state: NodeState = {}
        nodeAny.__h = state
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
    replaceMany(null, [root], harmajaElement)
}

/**
 *  Unmounts the given element, removing it from the DOM.
 * 
 *  - Causes the component to be deactivated, i.e. to stop listening to observables 
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export function unmount(harmajaElement: HarmajaOutput) {
    removeNode(null, 0, harmajaElement)
}

/**
 *  Add onMount callback. Called once after the component has been mounted on the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onMount(callback: Callback) {
    const transientState = getTransientState("onMount")
    if (!transientState.mountCallbacks) transientState.mountCallbacks = []
    transientState.mountCallbacks.push(callback)
}

/**
 *  Add onUnmount callback. Called once after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onUnmount(callback: Callback) {
    const transientState = getTransientState("onUnmount")
    if (!transientState.unmountCallbacks) transientState.unmountCallbacks = []
    transientState.unmountCallbacks.push(callback)
}

/**
 *  The onMount event as EventStream, emitting a value after the component has been mounted to the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function mountEvent(): Bacon.EventStream<void> {
    const transientState = getTransientState("mountEvent")
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
    const transientState = getTransientState("unmountEvent")
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

function attachOnMount(element: DOMNode, onMount: Callback) {
    if (typeof onMount !== "function") {
        throw Error("not a function: " + onMount);
    }
    let state = getNodeState(element)
    if (!state.onMounts) {
        state.onMounts = []
    }
    state.onMounts.push(onMount)
}
function attachOnUnmount(element: DOMNode, onUnmount: Callback) {
    if (typeof onUnmount !== "function") {
        throw Error("not a function: " + onUnmount);
    }
    let state = getNodeState(element)
    if (!state.onUnmounts) {
        state.onUnmounts = []
    }
    if (state.onUnmounts.includes(onUnmount)) {
        //console.log("Duplicate")
        return
    }
    state.onUnmounts.push(onUnmount)
}

function detachOnUnmount(element: DOMNode, onUnmount: Callback) {
    let state = maybeGetNodeState(element)
    if (state === undefined || !state.onUnmounts) {
        return
    }
    for (let i = 0; i < state.onUnmounts.length; i++) {
        if (state.onUnmounts[i] === onUnmount) {
            state.onUnmounts.splice(i, 1)
            return
        }
    }
}

function detachOnUnmounts(element: DOMNode): Callback[] {
    let state = maybeGetNodeState(element)
    if (state === undefined || !state.onUnmounts) {
        return []
    }
    let unmounts = state.onUnmounts
    //console.log("Detaching " + state.onUnmounts.length + " unmounts")
    delete state.onUnmounts
    return unmounts
}

function detachController(oldElements: ChildNode[], controller: NodeController) {
    for (const el of oldElements) {
        const state = getNodeState(el)
        //console.log("Detach controller from " + debug(el))
        const index = state.controllers?.indexOf(controller)
        if (index === undefined || index < 0) {
            throw Error("Controller not attached to " + el)
        }
        // Not removing controller from list. Even though the element is discarded, it's still not ok to
        // attach other controllers to it.        
    }
    if (controller.unsub) detachOnUnmount(oldElements[0], controller.unsub)
}

function createController(elements: ChildNode[], bootstrap: (controller: NodeController) => Callback) {
    const controller: NodeController = {
        currentElements: elements
    }
    attachController(elements, controller, bootstrap)
    return elements
}

function attachController(elements: ChildNode[], controller: NodeController, bootstrap?: (controller: NodeController) => Callback) {
    for (let i = 0; i < elements.length; i++) {
        let el = elements[i]
        const state = getNodeState(el)    
        // Checking for double controllers    
        if (!state.controllers) {
            state.controllers = [controller]
            //console.log("Attach first controller to " + debug(el) + " (now with " + state.controllers.length + ")")
        } else if (state.controllers.includes(controller)) {
            //console.log("Skip duplicate controller to " + debug(el) + " (now with " + state.controllers.length + ")")
        } else {
            state.controllers.push(controller)
            //console.log("Attach controller to " + debug(el) + " (now with " + state.controllers.length + ")")
        }    
        // Sub/unsub logic                
        if (i == 0) {
            if (bootstrap) {
                if (state.mounted) {
                    throw Error("Unexpected: Component already mounted")
                } else {
                    attachOnMount(el, () => {
                        const unsub = bootstrap(controller)                        
                        controller.unsub = unsub
                        el = controller.currentElements[0] // may have changed in bootstrap!                        
                        attachOnUnmount(el, controller.unsub)
                    })
                }
            }
            if (controller.unsub) {
                attachOnUnmount(el, controller.unsub)
            }
        }
    }
}

// When some elements are replaced externally (i.e. by their own controllers) we have to do some bookkeeping.
function replacedExternally(controller: NodeController, oldNodes: DOMNode[], newNodes: DOMNode[]) {
    //console.log(`Moving controller ${controller} from ${debug(oldNodes)} to ${debug(newNodes)}. Currently has elements ${debug(controller.currentElements)}`)
    let firstIndex = -1
    let lastIndex = -1
    if (oldNodes.length === 0) throw Error("Empty list of nodes")
    for (const oldNode of oldNodes) {
        const index = controller.currentElements.indexOf(oldNode)
        if (index < 0) {
            throw Error(`Element not found: ${debug(oldNode)}`)
        }
        if (lastIndex >= 0 && index != lastIndex + 1) {
            throw Error("Non-consecutive nodes " + oldNodes)
        }
        if (firstIndex < 0) {
            firstIndex = index
        }
        lastIndex = index
    }
    if (firstIndex < 0 || lastIndex < 0) throw Error("Assertion failed")
    detachController(oldNodes, controller)
    controller.currentElements = [
        ...controller.currentElements.slice(0, firstIndex), 
        ...newNodes, 
        ...controller.currentElements.slice(lastIndex + 1)
    ]
    attachController(controller.currentElements, controller)
    //console.log(`Moved controller ${controller} from ${debug(oldNodes)} to ${debug(newNodes)}. Now has elements ${debug(controller.currentElements)}`)
}

function replacedByController(controller: NodeController | null, oldNodes: DOMNode[], newNodes: DOMNode[]) {
    if (!controller) return
    // Controllers are in leaf-to-root order (because leaf controllers are added first)
    const controllers = getNodeState(oldNodes[0]).controllers 
    if (!controllers) throw new Error("Assertion failed: Controllers not found for " + debug(oldNodes[0]))
    const index = controllers.indexOf(controller)    
    //console.log(`${debug(oldNodes)} replaced by ${debug(newNodes)} controller ${index} of ${controllers.length}`)
    const parentControllers = controllers.slice(index + 1)
    for (let i = 1; i < oldNodes.length; i++) {
        const controllersHere = (getNodeState(oldNodes[i]).controllers || [])
        const indexHere = controllersHere.indexOf(controller)
        if (indexHere < 0) {
            throw new Error(`Controller ${controller} not found in ${debug(oldNodes[i])}`)
        }
        const parentControllersHere = controllersHere.slice(indexHere + 1)
        if (!arrayEq(parentControllers, parentControllersHere)) {
            throw new Error(`Assertion failed: controller array of ${debug(oldNodes[i])} (${controllersHere}, replacer index ${indexHere}) not equal to that of ${debug(oldNodes[0])} (${controllers}).`)
        }
    }
    // We need to replace the upper controllers
    for (let parentController of parentControllers) {
        replacedExternally(parentController, oldNodes, newNodes)
    }
}

function appendedByController(controller: NodeController, cursorNode: ChildNode, newNode: ChildNode) {
    if (!controller) return
    // Controllers are in leaf-to-root order (because leaf controllers are added first)
    const controllers = getNodeState(cursorNode).controllers 
    if (!controllers) throw new Error("Assertion failed: Controllers not found for " + debug(cursorNode))
    const index = controllers.indexOf(controller)    
    if (index < 0) {
        throw new Error(`Controller ${controller} not found in ${debug(cursorNode)}`)
    }
    //console.log(`${debug(newNode)} added after ${debug(cursorNode)} by controller ${index} of ${controllers.length}`)
    const parentControllers = controllers.slice(index + 1)
    // We need to replace the upper controllers
    for (let parentController of parentControllers) {   

        const indexForCursor = parentController.currentElements.indexOf(cursorNode)
        if (indexForCursor < 0) {
            throw new Error(`Element ${debug(cursorNode)} not found in node list of Controller ${parentController} not found in `)
        }
        parentController.currentElements.splice(indexForCursor + 1, 0, newNode)
        attachController([newNode], parentController)
    }    
}

function arrayEq<A>(xs: A[], ys: A[]) {
    if (xs.length !== ys.length) return false
    for (let i = 0; i < xs.length; i++) {
        if (xs[i] !== ys[i]) return false
    }
    return true
}

function replaceNode(controller: NodeController, index: number, newNode: DOMNode) {
    const oldNode = controller.currentElements[index]    
    controller.currentElements[index] = newNode           
    detachController([oldNode], controller)
    attachController([newNode], controller)    

    let wasMounted = maybeGetNodeState(oldNode)?.mounted
    
    if (wasMounted) {
        callOnUnmounts(oldNode)
    }
    if (!oldNode.parentElement) {
        //console.warn("Parent element not found for", oldElement, " => fail to replace")
        return
    }
    oldNode.parentElement.replaceChild(newNode, oldNode)
    //console.log("Replaced " + debug(oldElement) + " with " + debug(newElement) + " wasMounted=" + wasMounted)
    replacedByController(controller, [oldNode], [newNode])
    if (wasMounted) {
        callOnMounts(newNode)
    }
}

function replaceMany(controller: NodeController | null, oldContent: HarmajaOutput, newContent: HarmajaOutput) {
    const oldNodes = toDOMNodes(oldContent)
    const newNodes = toDOMNodes(newContent)
    if (controller) {
        controller.currentElements = newNodes
        detachController(oldNodes, controller)
        attachController(newNodes, controller)
    }
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
    replacedByController(controller, oldNodes, newNodes)
    for (let node of newNodes) {
        callOnMounts(node)
    }
    //console.log("Replaced " + debug(oldContent) + " with " + debug(newContent))
}

function addAfterNode(controller: NodeController, current: ChildNode, next: ChildNode) {
    controller.currentElements.push(next)
    attachController([next], controller)
    current.after(next)

    appendedByController(controller, current, next)

    callOnMounts(next)
}

function toDOMNodes(elements: HarmajaOutput): DOMNode[] {
    if (elements instanceof Array) return elements.flatMap(toDOMNodes)
    return [elements]
}

function removeNode(controller: NodeController | null, index: number, oldNode: HarmajaOutput) {    
    if (oldNode instanceof Array) {
        if (controller) throw Error("Only single node supported with controller option")
        for (const node of oldNode) {
            removeNode(controller, index, node)
        }
    } else {
        if (controller) {
            controller.currentElements.splice(index, 1)
            detachController([oldNode], controller)
        }    
        callOnUnmounts(oldNode)
        oldNode.remove()
        replacedByController(controller, [oldNode], [])
        //console.log("Removed " + debug(oldElement))
    }
}  

function appendNode(rootElement: DOMNode, child: DOMNode) {
    rootElement.appendChild(child)
    if (maybeGetNodeState(rootElement)?.mounted) {
        callOnMounts(child)
    }
}

export function debug(element: HarmajaOutput | Node): string {
    if (element instanceof Array) {
        return element.map(debug).join(",")
    } else if (element instanceof Element) {
        return element.outerHTML;
    } else {
        return element.textContent || ((element as any)._h_id != undefined ? `<placeholder ${(element as any)._h_id}>` : "<empty text node>")
    }
}

export const LowLevelApi = {
    createPlaceholder,
    attachOnMount,
    attachOnUnmount,
    detachOnUnmount,
    detachOnUnmounts,
    createController,
    appendNode,
    removeNode,
    addAfterNode,
    replaceNode,
    replaceMany,
    toDOMNodes
}