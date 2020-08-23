import * as Bacon from "baconjs"
import { isAtom } from "./atom"

export type HarmajaComponent = (props: HarmajaProps) => DOMElement
export type JSXElementType = string | HarmajaComponent

export type HarmajaProps = Record<string, any>
export type HarmajaChild = HarmajaObservableChild | DOMElement | string | number | null
export type HarmajaObservableChild = Bacon.Property<HarmajaChild>

export type DOMElement = HTMLElement | Text

export function mount(ve: DOMElement, root: HTMLElement) {
    root.parentElement!.replaceChild(ve, root)
}

type UnmountCallback = Bacon.Unsub

let transientStateStack: TransientState[] = []
type TransientState = { unmountCallbacks?: UnmountCallback[], unmountE?: Bacon.EventStream<void> }

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
        const transientState = transientStateStack.pop()!
        for (const callback of transientState.unmountCallbacks || []) {
            attachUnsub(element, callback)
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

export function onUnmount(callback: UnmountCallback) {
    const transientState = getTransientState()
    if (!transientState.unmountCallbacks) transientState.unmountCallbacks = []
    transientState.unmountCallbacks.push(callback)
}

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
            const unsub = observable.skipDuplicates().forEach(nextValue => {
                setProp(el, key, nextValue)        
            })
            attachUnsub(el, unsub)
        } else {
            setProp(el, key, value as string)        
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
        let element: DOMElement | null = null
        const unsub = observable.skipDuplicates().forEach(nextValue => {
            if (!element) {
                element = renderChild(nextValue)
            } else {
                let oldElement = element
                element = renderChild(nextValue)
                //console.log("Replacing", oldElement, "with", element)
                // TODO: can we handle a case where the observable yields multiple elements? Currently not.
                //console.log("Replacing element", oldElement)
                detachUnsub(oldElement, unsub) // <- attaching unsub to the replaced element instead
                replaceElement(oldElement, element)
                attachUnsub(element, unsub)
            } 
        })
        if (!element) {
            element = createPlaceholder()
        }
        attachUnsub(element, unsub)
        return element
    }
    if (child instanceof HTMLElement || child instanceof Text) {
        return child
    }
    throw Error(child + " is not a valid element")
}

function setProp(el: HTMLElement, key: string, value: string) {
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

function unsubObservables(element: Element | Text | ChildNode) {
    if (element instanceof Text) return

    let elementAny = element as any
    if (elementAny.unsubs) {
        for (const unsub of elementAny.unsubs as Bacon.Unsub[]) {
            unsub()
        }
    }

    for (const child of element.childNodes) {
        unsubObservables(child)
    }
}

// TODO: separate low-level API

export function attachUnsub(element: HTMLElement | Text, unsub: Bacon.Unsub) {
    let elementAny = element as any
    if (!elementAny.unsubs) {
        elementAny.unsubs = []
    }
    elementAny.unsubs.push(unsub)
}

export function detachUnsub(element: HTMLElement | Text, unsub: Bacon.Unsub) {
    let elementAny = element as any
    if (!elementAny.unsubs) {
        return
    }
    for (let i = 0; i < elementAny.unsubs.length; i++) {
        if (elementAny.unsubs[i] === unsub) {
            elementAny.unsubs.splice(i, 1)
            return
        }
    }
}

export function replaceElement(oldElement: ChildNode, newElement: HTMLElement | Text) {
    unsubObservables(oldElement)
    if (!oldElement.parentElement) {
        console.warn("Parent element not found for", oldElement, " => fail to replace")
        return
    }

    oldElement.parentElement.replaceChild(newElement, oldElement)
}

export function removeElement(oldElement: ChildNode) {
    unsubObservables(oldElement)
    oldElement.remove()
}  