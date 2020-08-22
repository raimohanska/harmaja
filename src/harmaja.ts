import * as Bacon from "baconjs"

export type VDOMComponent = (props: VDOMProps) => VDOMElement
export type VDOMType = string | VDOMComponent
export type VDOMProps = Record<string, any>
export type VDOMChild = VDOMElement | string | number | VDOMObservableChild | null
export type VDOMStandardElement = { type: string, props: VDOMProps, children: VDOMChild[] }
export type VDOMElement = VDOMStandardElement | VDOMCustomElement
export type VDOMObservableChild = Bacon.Property<VDOMElement | string>
export type VDOMCustomElement = { type: "_custom_", renderHTML: () => any, key: "", props: {} } // the boilerplate is for JSX compatibility

export function createElement(type: VDOMType, props: VDOMProps, ...children: (VDOMChild | VDOMChild[])[]): VDOMElement {
    const flattenedChildren = children.flatMap(flattenChildren)
    if (props && props.children) {
        delete props.children // TODO: ugly hack, occurred in todoapp example
    }
    if (typeof type == "function") {        
        const constructor = type as VDOMComponent
        return constructor({...props, children: flattenedChildren})
    } else if (typeof type == "string") {
        return {type, props, children: flattenedChildren } 
    } else {
        console.error("Unexpected createElement call with arguments", arguments)
        throw Error(`Unknown type ${type}`)
    }
}

function flattenChildren(child: VDOMChild | VDOMChild[]): VDOMChild[] {
    if (child instanceof Array) return child.flatMap(flattenChildren)
    return [child]
}

function isElement(x: any): x is VDOMElement {
    return typeof x === "object" && typeof x.type === "string"
}

function isCustomElement(e: any): e is VDOMCustomElement {
    return e.type === "_custom_"
}

// Our custom React interface for JSX
// TODO: typings for JSX
export const React = {
    createElement
}

export function mount(ve: VDOMElement | any, root: HTMLElement) {
    root.parentElement!.replaceChild(renderHTML(ve), root)
}

export function renderHTML(ve: VDOMChild): HTMLElement | Text {
    if (typeof ve === "string" || typeof ve === "number") {
        return document.createTextNode(ve.toString())
    }
    if (ve instanceof Bacon.Property) {
        const observable = ve as Bacon.Property<VDOMElement | string>
        const currentValue: string | VDOMElement = getCurrentValue(observable)
        let element: HTMLElement | Text = renderHTML(currentValue as any)
        const unsub = observable.skipDuplicates().changes().forEach((currentValue: VDOMElement | string )=> {
            let oldElement = element
            element = renderHTML(currentValue as any)
            // TODO: can we handle a case where the observable yields multiple elements? Currently not.
            //console.log("Replacing element", oldElement)
            replaceElement(oldElement, element)
            attachUnsub(element, unsub)
        })
        attachUnsub(element, unsub)
        return element
    }

    if (ve === null) {
        return document.createTextNode("")
    }
    if (isCustomElement(ve)) {
        return ve.renderHTML()
    }

    const el = document.createElement(ve.type)
    for (let [key, value] of Object.entries(ve.props || {})) {
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
    
    for (const child of ve.children || []) {
        el.appendChild(renderHTML(child))
    }
    return el
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
      const unsub = observable.onValue(v => (currentV = v));
      unsub();
    }
    if (currentV === valueMissing) {
        console.log("Current value not found!", observable);
        throw new Error("Current value missing. Cannot render. " + observable);
    }      
    return currentV;
  };


export function createCustomElement(renderHTML: () => HTMLElement | Text) {
    return {
        key: "", // key, props, type needed for JSX to work
        type: "_custom_",
        props: {},
        renderHTML
    }
}

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