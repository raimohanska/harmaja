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

type UnmountCallback = () => void
let unmountCallbacks: UnmountCallback[] = []
let unmountE: Bacon.EventStream<void> | null = null

export function createElement(type: JSXElementType, props: HarmajaProps, ...children: (HarmajaChild | HarmajaChild[])[]): DOMElement {
    const flattenedChildren = children.flatMap(flattenChildren)
    if (props && props.children) {
        delete props.children // TODO: ugly hack, occurred in todoapp example
    }
    if (typeof type == "function") {        
        const constructor = type as HarmajaComponent
        unmountCallbacks = []
        unmountE = null
        // TODO: test unmount callbacks, observable scoping
        const mappedProps = props && Object.fromEntries(Object.entries(props).map(([key, value]) => [key, applyComponentScopeToObservable(value)]))
        const element = constructor({...mappedProps, children: flattenedChildren})
        for (const callback of unmountCallbacks) {
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

export function onUnmount(callback: UnmountCallback) {
    unmountCallbacks.push(callback)
}

export function unmountEvent(): Bacon.EventStream<void> {
    if (!unmountE) {
        const event = new Bacon.Bus<void>()
        onUnmount(() => {
            event.push()
            event.end()
        })    
        unmountE = event
    }
    return unmountE
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
            value = getCurrentValue(observable)
            const unsub = observable.skipDuplicates().changes().forEach((newValue: string) => {
                setProp(el, key, newValue)    
            })
            attachUnsub(el, unsub)
        }
        setProp(el, key, value as string)        
    }
    
    for (const child of children || []) {
        el.appendChild(renderChild(child))
    }
    return el
}

function renderChild(ve: HarmajaChild): DOMElement {
    if (typeof ve === "string" || typeof ve === "number") {
        return document.createTextNode(ve.toString())
    }
    if (ve === null) {
        return document.createTextNode("")
    }
    if (ve instanceof Bacon.Property) {
        const observable = ve as HarmajaObservableChild
        const currentValue: HarmajaChild = getCurrentValue(observable)
        let element: DOMElement = renderChild(currentValue)
        const unsub = observable.skipDuplicates().changes().forEach((currentValue: HarmajaChild )=> {
            let oldElement = element
            element = renderChild(currentValue)
            // TODO: can we handle a case where the observable yields multiple elements? Currently not.
            //console.log("Replacing element", oldElement)
            replaceElement(oldElement, element)
            attachUnsub(element, unsub)
        })
        attachUnsub(element, unsub)
        return element
    }
    return ve
}

function setProp(el: HTMLElement, key: string, value: string) {
    if (key.startsWith("on")) {
        key = key.toLowerCase()
    } else if (key === "className") {
        key = "class"
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

function unsubObservablesInChildElements(element: Element | Text | ChildNode) {
    if (element instanceof Text) return
    for (const child of element.childNodes) {
        let elementAny = child as any
        if (elementAny.unsubs) {
            for (const unsub of elementAny.unsubs as Bacon.Unsub[]) {
                unsub()
            }
        }
        unsubObservablesInChildElements(child)
    }
}

export function attachUnsub(element: HTMLElement | Text, unsub: Bacon.Unsub) {
    let elementAny = element as any
    if (!elementAny.unsubs) {
        elementAny.unsubs = []
    }
    elementAny.unsubs.push(unsub)
}

const valueMissing = {}

// TODO: separate low-level API
export function getCurrentValue<A>(observable: Bacon.Property<A>): A {
    let currentV: any = valueMissing;
    if ((observable as any).get) {
      currentV = (observable as any).get(); // For Atoms
    } else {        
      const unsub = observable.subscribeInternal(e => {
          if (Bacon.hasValue(e)) {
              currentV = e.value;
          }
      })       
      unsub();
    }
    if (currentV === valueMissing) {
        console.log("Current value not found!", observable);
        throw new Error("Current value missing. Cannot render. " + observable);
    }      
    return currentV;
  };

export function replaceElement(oldElement: ChildNode, newElement: HTMLElement | Text) {
    unsubObservablesInChildElements(oldElement)
    if (!oldElement.parentElement) {
        return
    }

    oldElement.parentElement.replaceChild(newElement, oldElement)
}

export function removeElement(oldElement: ChildNode) {
    unsubObservablesInChildElements(oldElement)
    oldElement.remove()
}  