import * as O from "./observable/observables"

export type HarmajaComponent = (props: HarmajaProps) => HarmajaOutput
export type JSXElementType = string | HarmajaComponent

export type HarmajaProps = Record<string, any>
export type HarmajaChild =
    | HarmajaObservableChild
    | DOMNode
    | string
    | number
    | null
export type HarmajaChildren = (HarmajaChild | HarmajaChildren)[]
export type HarmajaChildOrChildren = HarmajaChild | HarmajaChildren
// TODO: naming sucks
export interface HarmajaObservableChild
    extends O.Property<HarmajaChildOrChildren> {}
export type HarmajaStaticOutput = DOMNode | DOMNode[] // Can be one or more, but an empty array is not allowed
export type HarmajaOutput = DOMNode | HarmajaDynamicOutput | HarmajaOutput[]
export interface HarmajaDynamicOutput extends O.Property<HarmajaOutput> {}
export type DOMNode = ChildNode

let transientStateStack: TransientState[] = []
type TransientState = {
    mountCallbacks: Callback[]
    mountE: O.EventStream<void> | undefined
    unmountCallbacks: Callback[]
    unmountE: O.EventStream<void> | undefined
    scope: O.Scope | undefined
    mountsController: NodeController | undefined
}

// If we need an empty object or empty array for no-oping purposes,
// Reuse the same frozen objects each time
// We also use these for constructing NodeState so that
// the object shape is guaranteed to be uniform (which may garner some JIT optimizations),
//without allocating any meaningful extra memory.
const EMPTY_OBJECT = Object.freeze({})
const EMPTY_ARRAY: any[] = []
// separate freezing to trick TSC
Object.freeze(EMPTY_ARRAY)

function emptyTransientState(): TransientState {
    return {
        mountCallbacks: EMPTY_ARRAY as Callback[],
        mountE: undefined,
        unmountCallbacks: EMPTY_ARRAY as Callback[],
        unmountE: undefined,
        scope: undefined,
        mountsController: undefined,
    }
}

/**
 *  Element constructor used by JSX.
 */
export function createElement(
    type: JSXElementType,
    props?: HarmajaProps,
    ...children: HarmajaChildren
): HarmajaOutput {
    const flattenedChildren = children.flatMap(flattenChildren)
    if (!props) {
        props = EMPTY_OBJECT
    } else if (props.children) {
        delete props.children // TODO: ugly hack, occurred in todoapp example
    }
    if (typeof type == "function") {
        const constructor = type as HarmajaComponent
        transientStateStack.push(emptyTransientState())
        const result = constructor({ ...props, children: flattenedChildren })
        const transientState = transientStateStack.pop()!
        if (O.isProperty(result)) {
            return createController(
                [placeholders.create()],
                composeControllers(
                    handleMounts(transientState),
                    startUpdatingNodes(result as HarmajaObservableChild)
                )
            )
        } else if (
            transientState.unmountCallbacks ||
            transientState.mountCallbacks ||
            transientState.scope
        ) {
            return createController(
                toDOMNodes(render(result)),
                handleMounts(transientState)
            )
        } else {
            return result
        }
    } else if (typeof type == "string") {
        return renderElement(type, props, flattenedChildren)
    } else {
        console.error("Unexpected createElement call with arguments", arguments)
        throw Error(`Unknown type ${type}`)
    }
}

function composeControllers(
    c1: NodeControllerFn,
    c2: NodeControllerFn
): NodeControllerFn {
    return (controller) => {
        const unsub1 = c1(controller)
        const unsub2 = c2(controller)
        return () => {
            unsub2()
            unsub1()
        }
    }
}

const handleMounts = (transientState: TransientState) => (
    controller: NodeController
) => {
    if (transientState.scope) {
        transientState.mountsController = controller
    }
    for (const callback of transientState.mountCallbacks) {
        callback()
    }
    return () => {
        for (const callback of transientState.unmountCallbacks) {
            callback()
        }
    }
}

export function Fragment({
    children,
}: {
    children: HarmajaChildren
}): HarmajaOutput {
    return children.flatMap(flattenChildren).flatMap(render)
}

function flattenChildren(child: HarmajaChildOrChildren): HarmajaChild[] {
    if (child instanceof Array) return child.flatMap(flattenChildren)
    return [child]
}

function renderElement(
    type: string,
    props: HarmajaProps,
    children: HarmajaChild[]
): DOMNode {
    const el = document.createElement(type)
    let contentEditable = false
    const props_ = props || EMPTY_OBJECT
    for (let key of Object.keys(props_)) {
        const value = props_[key]
        if (key === "contentEditable" && value !== false && value !== "false") {
            contentEditable = true
        }
        if (O.isProperty(value)) {
            attachOnMount(el, () => {
                const unsub = O.forEach(value, (nextValue) => {
                    setProp(el, key, nextValue)
                })
                attachOnUnmount(el, unsub)
            })
        } else {
            setProp(el, key, value)
        }
    }
    if (contentEditable) {
        addContentEditableController(el, children)
    } else {
        ;(children || EMPTY_ARRAY)
            .map(render)
            .flatMap(toDOMNodes)
            .forEach((node) => el.appendChild(node))
    }
    return el
}

function addContentEditableController(
    el: HTMLElement,
    children: HarmajaChild[]
) {
    if (!children || children.length == 0) {
        return
    }
    if (children.length != 1) {
        throw Error(
            "contentEditable elements expected to contain zero to one child"
        )
    }
    const child = children[0]
    if (!O.isProperty(child)) {
        throw Error(
            "contentEditable element must have an Observable<string> as child"
        )
    }
    const observable = child as O.Property<string>

    createController(
        [el],
        (controller: NodeController): Callback => {
            return O.forEach(observable, (nextValue) => {
                if (typeof nextValue !== "string") {
                    throw Error(
                        `Value for contentEditable is not string: ${nextValue} is a ${typeof nextValue}.`
                    )
                }
                if (nextValue !== el.textContent) {
                    el.textContent = nextValue
                }
            })
        }
    )
}

const placeholders = (function () {
    let counter = 1

    return {
        create: (): Text => {
            const placeholder = document.createTextNode("")
            ;(placeholder as any)._h_id = counter++
            return placeholder
        },
        isPlaceholder: (node: Node): boolean =>
            (node as any)._h_id !== undefined,
        getId: (node: Node): number | undefined => (node as any)._h_id,
    }
})()

function render(child: HarmajaChild | HarmajaOutput): HarmajaStaticOutput {
    if (child instanceof Array) {
        return child.flatMap(render)
    }
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(child.toString())
    }
    if (child === null || child === false) {
        return placeholders.create()
    }
    if (O.isProperty(child)) {
        return createController(
            [placeholders.create()],
            startUpdatingNodes(child as HarmajaObservableChild)
        )
    }
    if (isDOMElement(child)) {
        return child
    }
    throw Error(child + " is not a valid element")
}

const startUpdatingNodes = (observable: HarmajaObservableChild) => (
    controller: NodeController
): Callback => {
    return O.forEach(observable, (nextChildren: HarmajaChildOrChildren) => {
        let oldElements = controller.currentElements.slice()
        let newNodes = flattenChildren(nextChildren)
            .flatMap(render)
            .flatMap(toDOMNodes)
        if (newNodes.length === 0) {
            newNodes = [placeholders.create()]
        }
        //console.log("New values", debug(controller.currentElements))
        //console.log(`${debug(oldElements)} replaced by ${debug(controller.currentElements)} in observable`)

        replaceAll(controller, oldElements, newNodes)
    })
}

function isDOMElement(child: any): child is DOMNode {
    return child instanceof Element || child instanceof Text
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
        key = key === "ondoubleclick" ? "ondblclick" : key
        ;(el as any)[key] = value
    } else if (key === "style") {
        const styles = Object.keys(value)
            .filter((key) => key !== "")
            .map((key) => `${toKebabCase(key)}: ${value[key]};`)
            .join("\n")
        el.setAttribute("style", styles)
    } else if (key === "className") {
        el.setAttribute("class", value)
    } else if (key in el) {
        ;(el as any)[key] = value
    } else {
        el.setAttribute(key, value)
    }
}

function toKebabCase(inputString: string) {
    return inputString
        .split("")
        .map((character) => {
            if (character == character.toUpperCase()) {
                return "-" + character.toLowerCase()
            } else {
                return character
            }
        })
        .join("")
}

function getTransientState(forMethod: string) {
    if (transientStateStack.length == 0) {
        throw Error(
            `Illegal ${forMethod} call outside component constructor call`
        )
    }
    return transientStateStack[transientStateStack.length - 1]
}

export type Callback = () => void

type NodeState = {
    mounted: boolean
    unmounted: boolean
    onUnmounts: Callback[]
    onMounts: Callback[]
    controllers: NodeController[]
}

export type NodeController = {
    unsub?: Callback
    currentElements: DOMNode[]
} & NodeControllerOptions

type NodeControllerOptions = {
    onReplace?: (oldNodes: DOMNode[], newNodes: DOMNode[]) => void
}

type NodeControllerFn = (controller: NodeController) => Callback

const nodeState = (function () {
    return {
        getIfExists(node: Node): NodeState | undefined {
            return (node as any).__h
        },
        getOrInstantiate(node: Node): NodeState {
            let currentNodeState: NodeState = (node as any).__h
            if (currentNodeState === undefined) {
                currentNodeState = {
                    mounted: false,
                    unmounted: false,
                    onMounts: EMPTY_ARRAY,
                    onUnmounts: EMPTY_ARRAY,
                    controllers: EMPTY_ARRAY,
                }
                ;(node as any).__h = currentNodeState
            }
            return currentNodeState
        },
    }
})()

/**
 *  Mounts the given element to the document, replacing the given root element.
 *
 *  - Causes the component to be activated, i.e. to start listening to observables
 *  - `onMount` callbacks will be called
 *  - `onMountEvent` will be triggered
 */
export function mount(
    harmajaElement: HarmajaOutput,
    root: Element
): HarmajaStaticOutput {
    const rendered = render(harmajaElement)
    replaceAll(null, [root], rendered)
    return rendered
}

/**
 *  Unmounts the given element, removing it from the DOM.
 *
 *  - Causes the component to be deactivated, i.e. to stop listening to observables
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export function unmount(harmajaElement: HarmajaOutput) {
    if (O.isProperty(harmajaElement)) {
        // A dynamic component, let's try to find the current mounted nodes
        //console.log("Unmounting dynamic", harmajaElement)
        unmount(O.get(harmajaElement))
    } else if ((harmajaElement as any) instanceof Array) {
        //console.log("Unmounting array")
        ;(harmajaElement as Array<any>).forEach(unmount)
    } else {
        //console.log("Unmounting node", debug(harmajaElement))
        removeNode(null, 0, harmajaElement)
    }
}

/**
 *  Add onMount callback. Called once after the component has been mounted on the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onMount(callback: Callback) {
    const transientState = getTransientState("onMount")
    if (transientState.mountCallbacks === EMPTY_ARRAY)
        transientState.mountCallbacks = []
    transientState.mountCallbacks.push(callback)
}

/**
 *  Add onUnmount callback. Called once after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function onUnmount(callback: Callback) {
    const transientState = getTransientState("onUnmount")
    if (transientState.unmountCallbacks === EMPTY_ARRAY)
        transientState.unmountCallbacks = []
    transientState.unmountCallbacks.push(callback)
}

/**
 *  The onMount event as EventStream, emitting a value after the component has been mounted to the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function mountEvent(): O.NativeEventStream<void> {
    const transientState = getTransientState("mountEvent")
    if (!transientState.mountE) {
        const event = O.bus<void>()
        onMount(() => {
            O.pushAndEnd(event, undefined)
        })
        transientState.mountE = event
    }
    return transientState.mountE! as O.NativeEventStream<void>
}

/**
 *  The onUnmount event as EventStream, emitting a value after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export function unmountEvent(): O.NativeEventStream<void> {
    const transientState = getTransientState("unmountEvent")
    if (!transientState.unmountE) {
        const event = O.bus<void>()
        onUnmount(() => {
            O.pushAndEnd(event, undefined)
        })
        transientState.unmountE = event
    }
    return transientState.unmountE! as O.NativeEventStream<void>
}

export function componentScope(): O.Scope {
    const transientState = getTransientState("unmountEvent")
    if (!transientState.scope) {
        const unmountE = unmountEvent()
        const mountE = mountEvent()

        transientState.scope = O.mkScope((onIn: () => O.Unsub) => {
            let unsub: O.Unsub | null = null
            O.forEach(unmountE, () => {
                if (unsub) unsub()
            })
            if (transientState.mountsController) {
                const state = nodeState.getOrInstantiate(
                    transientState.mountsController.currentElements[0]
                )
                if (state.mounted) {
                    unsub = onIn()
                    return
                }
            }
            O.forEach(mountE, () => {
                unsub = onIn()
            })
        })
    }
    return transientState.scope
}

export function callOnMounts(element: Node) {
    //console.log("callOnMounts in " + debug(element) + " mounted=" + getNodeState(element).mounted)
    let state = nodeState.getOrInstantiate(element)
    if (state.mounted) {
        return
    }
    if (state.unmounted) {
        throw new Error("Component re-mount not supported")
    }

    state.mounted = true
    for (const sub of state.onMounts) {
        sub()
    }

    for (const child of element.childNodes) {
        callOnMounts(child)
    }
}

function callOnUnmounts(element: Node) {
    //console.log("callOnUnmounts " + debug(element))
    let state = nodeState.getOrInstantiate(element)
    if (!state.mounted) {
        return
    }

    for (const unsub of state.onUnmounts) {
        //console.log("Calling unsub in " + debug(element))
        unsub()
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
        throw Error("not a function: " + onMount)
    }
    let state = nodeState.getOrInstantiate(element)
    if (state.onMounts === EMPTY_ARRAY) {
        state.onMounts = []
    }
    state.onMounts.push(onMount)
}
function attachOnUnmount(element: DOMNode, onUnmount: Callback) {
    if (typeof onUnmount !== "function") {
        throw Error("not a function: " + onUnmount)
    }
    let state = nodeState.getOrInstantiate(element)
    if (state.onUnmounts === EMPTY_ARRAY) {
        state.onUnmounts = []
    }
    if (state.onUnmounts.includes(onUnmount)) {
        //console.log("Duplicate")
        return
    }
    state.onUnmounts.push(onUnmount)
}

function detachOnUnmount(element: DOMNode, onUnmount: Callback) {
    let state = nodeState.getIfExists(element)
    if (state === undefined || state.onUnmounts === EMPTY_ARRAY) {
        return
    }
    for (let i = 0; i < state.onUnmounts.length; i++) {
        if (state.onUnmounts[i] === onUnmount) {
            state.onUnmounts.splice(i, 1)
            return
        }
    }
}

function detachController(
    oldElements: ChildNode[],
    controller: NodeController
) {
    for (const el of oldElements) {
        const state = nodeState.getOrInstantiate(el)
        //console.log("Detach controller from " + debug(el))
        const index = state.controllers.indexOf(controller)
        if (index === -1) {
            throw Error("Controller not attached to " + el)
        }
        // Not removing controller from list. Even though the element is discarded, it's still not ok to
        // attach other controllers to it.
        if (controller.unsub) detachOnUnmount(el, controller.unsub)
    }
}

function createController(
    elements: ChildNode[],
    bootstrap: NodeControllerFn,
    options?: NodeControllerOptions
) {
    const controller: NodeController = {
        ...options,
        currentElements: elements,
    }
    attachController(elements, controller, bootstrap)
    return elements
}

function attachController(
    elements: ChildNode[],
    controller: NodeController,
    bootstrap?: (controller: NodeController) => Callback,
    skipAttachControllerUnsub?: boolean
) {
    for (let i = 0; i < elements.length; i++) {
        let el = elements[i]
        const state = nodeState.getOrInstantiate(el)
        // Checking for double controllers
        if (state.controllers === EMPTY_ARRAY) {
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
            if (controller.unsub && !skipAttachControllerUnsub) {
                attachOnUnmount(el, controller.unsub)
            }
        }
    }
}

// When some elements are replaced externally (i.e. by their own controllers) we have to do some bookkeeping.
function replacedExternally(
    controller: NodeController,
    oldNodes: DOMNode[],
    newNodes: DOMNode[]
) {
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
    if (firstIndex < 0 || lastIndex < 0) throw Error("Assertion failed")
    if (controller.onReplace) {
        controller.onReplace(oldNodes, newNodes)
    }
    detachController(oldNodes, controller)
    controller.currentElements = [
        ...controller.currentElements.slice(0, firstIndex),
        ...newNodes,
        ...controller.currentElements.slice(lastIndex + 1),
    ]
    attachController(controller.currentElements, controller)
    //console.log(`Moved controller ${controller} from ${debug(oldNodes)} to ${debug(newNodes)}. Now has elements ${debug(controller.currentElements)}`)
}

function replacedByController(
    controller: NodeController | null,
    oldNodes: DOMNode[],
    newNodes: DOMNode[]
) {
    if (!controller) return
    // Controllers are in leaf-to-root order (because leaf controllers are added first)
    const controllers = nodeState.getOrInstantiate(oldNodes[0]).controllers
    const index = controllers.indexOf(controller)
    //console.log(`${debug(oldNodes)} replaced by ${debug(newNodes)} controller ${index} of ${controllers.length}`)
    const parentControllers = controllers.slice(index + 1)
    // This loop is just about assertion of invariables
    for (let i = 1; i < oldNodes.length; i++) {
        const controllersHere = nodeState.getOrInstantiate(oldNodes[i])
            .controllers
        const indexHere = controllersHere.indexOf(controller)
        if (indexHere < 0) {
            throw new Error(
                `Controller ${controller} not found in ${debug(oldNodes[i])}`
            )
        }
        const parentControllersHere = controllersHere.slice(indexHere + 1)
        if (!arrayEq(parentControllers, parentControllersHere)) {
            throw new Error(
                `Assertion failed: controller array of ${debug(
                    oldNodes[i]
                )} (${controllersHere}, replacer index ${indexHere}) not equal to that of ${debug(
                    oldNodes[0]
                )} (${controllers}).`
            )
        }
    }
    // We need to replace the upper controllers
    for (let parentController of parentControllers) {
        replacedExternally(parentController, oldNodes, newNodes)
    }
}

function appendedByController(
    controller: NodeController,
    cursorNode: ChildNode,
    newNode: ChildNode
) {
    if (!controller) return
    // Controllers are in leaf-to-root order (because leaf controllers are added first)
    const controllers = nodeState.getOrInstantiate(cursorNode).controllers
    const index = controllers.indexOf(controller)
    if (index < 0) {
        throw new Error(
            `Controller ${controller} not found in ${debug(cursorNode)}`
        )
    }
    //console.log(`${debug(newNode)} added after ${debug(cursorNode)} by controller ${index} of ${controllers.length}`)
    const parentControllers = controllers.slice(index + 1)
    // We need to replace the upper controllers
    for (let parentController of parentControllers) {
        const indexForCursor = parentController.currentElements.indexOf(
            cursorNode
        )
        if (indexForCursor < 0) {
            throw new Error(
                `Element ${debug(
                    cursorNode
                )} not found in node list of Controller ${parentController} not found in `
            )
        }
        parentController.currentElements.splice(indexForCursor + 1, 0, newNode)
        attachController([newNode], parentController)
    }
}

function arrayEq<A>(xs: A[], ys: A[]) {
    if (xs.length !== ys.length) return false
    for (let i = 0; i < xs.length; i++) {
        if (xs[i] !== ys[i]) return false
    }
    return true
}

function replaceNode(
    controller: NodeController,
    index: number,
    newNode: DOMNode
) {
    const oldNode = controller.currentElements[index]
    controller.currentElements[index] = newNode
    detachController([oldNode], controller)
    attachController([newNode], controller)

    let wasMounted = nodeState.getIfExists(oldNode)?.mounted

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

function identicalNodes(oldNodes: ChildNode[], newNodes: ChildNode[]) {
    if (oldNodes.length !== newNodes.length) {
        return false
    }
    for (let i = 0; i < oldNodes.length; i++) {
        if (
            !(
                oldNodes[i] instanceof Text &&
                newNodes[i] instanceof Text &&
                oldNodes[i].textContent &&
                oldNodes[i].textContent === newNodes[i].textContent
            )
        ) {
            return false
        }
    }
    return true
}

function replaceAll(
    controller: NodeController | null,
    oldContent: HarmajaStaticOutput,
    newContent: HarmajaStaticOutput
) {
    const oldNodes = toDOMNodes(oldContent)
    const newNodes = toDOMNodes(newContent)
    if (identicalNodes(oldNodes, newNodes)) {
        return
    }
    if (controller) {
        controller.currentElements = newNodes
        detachController(oldNodes, controller)
        attachController(newNodes, controller)
    }
    if (oldNodes.length === 0) throw new Error("Cannot replace zero nodes")
    if (newNodes.length === 0) throw new Error("Cannot replace with zero nodes")
    oldNodes[0].parentElement!.replaceChild(newNodes[0], oldNodes[0])
    for (let i = 1; i < oldNodes.length; i++) {
        oldNodes[i].remove()
    }
    for (let i = 1; i < newNodes.length; i++) {
        newNodes[i - 1].after(newNodes[i])
    }
    replacedByController(controller, oldNodes, newNodes)
    for (let node of oldNodes) {
        callOnUnmounts(node)
    }
    for (let node of newNodes) {
        callOnMounts(node)
    }
    //console.log("Replaced " + debug(oldContent) + " with " + debug(newContent))
}

function replaceAllInPlace(
    controller: NodeController,
    oldNodes: ChildNode[],
    newNodes: ChildNode[],
    createdNodes: ChildNode[],
    deletedNodes: ChildNode[]
) {
    if (oldNodes.length === 0) throw new Error("Cannot replace zero nodes")
    if (newNodes.length === 0) throw new Error("Cannot replace with zero nodes")

    const oldFirst = controller.currentElements[0]
    controller.currentElements = newNodes
    detachController(deletedNodes, controller)
    attachController(createdNodes, controller, undefined, true)

    if (controller.unsub) {
        // Make sure newNodes[0] still calls controller.unsub on unmount
        if (deletedNodes.includes(oldFirst)) {
            attachOnUnmount(newNodes[0], controller.unsub)
        } else if (newNodes[0] !== oldNodes[0]) {
            detachOnUnmount(oldNodes[0], controller.unsub)
            attachOnUnmount(newNodes[0], controller.unsub)
        }
    }

    // oldNodes[0] may be the controller's initial text node, which hasn't been
    // added to DOM before the first render. Thus `parentElement?`.
    if (newNodes[0] !== oldNodes[0]) {
        oldNodes[0].parentElement?.replaceChild(newNodes[0], oldNodes[0])
    }
    deletedNodes.forEach((node) => node.remove())

    for (let i = 1; i < newNodes.length; i++) {
        const thisOne = newNodes[i - 1]
        const nextOne = newNodes[i]
        if (thisOne.nextSibling !== nextOne) {
            thisOne.after(nextOne)
        }
    }

    replacedByController(controller, oldNodes, newNodes)
    deletedNodes.forEach(callOnUnmounts)
    createdNodes.forEach(callOnMounts)
}

function appendNode(controller: NodeController, next: ChildNode) {
    const lastNode =
        controller.currentElements[controller.currentElements.length - 1]
    controller.currentElements.push(next)
    attachController([next], controller)
    lastNode.after(next)

    appendedByController(controller, lastNode, next)

    callOnMounts(next)
}

function toDOMNodes(elements: HarmajaStaticOutput): DOMNode[] {
    if (elements instanceof Array) return elements.flatMap(toDOMNodes)
    return [elements]
}

function removeNode(
    controller: NodeController | null,
    index: number,
    oldNode: HarmajaStaticOutput
) {
    if (oldNode instanceof Array) {
        if (controller)
            throw Error("Only single node supported with controller option")
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

export function debug(element: HarmajaStaticOutput | Node): string {
    if (element instanceof Array) {
        return element.map(debug).join(",") || "[]"
    } else if (element instanceof Element) {
        return element.outerHTML
    } else {
        return (
            element.textContent ||
            (placeholders.isPlaceholder(element)
                ? `<placeholder ${placeholders.getId(element)}>`
                : "<empty text node>")
        )
    }
}

export const LowLevelApi = {
    createPlaceholder: placeholders.create,
    attachOnMount,
    attachOnUnmount,
    createController,
    removeNode,
    appendNode,
    replaceNode,
    replaceAll,
    replaceAllInPlace,
    toDOMNodes,
    render,
}
