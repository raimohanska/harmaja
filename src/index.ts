import * as B from "baconjs"

type Child = string | HTMLElement | B.Observable<Child>
type Props = Record<string, any>
type DOMElement = HTMLElement | Text
type ComponentFn = (props: Props) => DOMElement
type Children = (Child | Child[])[]

export function createElement(type: string | Function, props: Props, ...children: Children): DOMElement {
    if (typeof type === "function") {
        const ctr = type as ComponentFn
        return ctr(props)

    }
    const element = document.createElement(type)
    for (let [key, value] of Object.entries(props || {})) {
        if (key.startsWith("on")) {
            key = key.toLowerCase()
        }
        (element as any)[key] = value
    }
    for (const child of children) {
        addChild(child, element)
    }
    return element
}

function addChild(child: Child | Child[], element: HTMLElement) {
    if (child instanceof Array) {
        for (let c of child) {
            addChild(c, element)
        }
    } else {
        element.appendChild(createChildElement(child))   
    }
}

function createChildElement(child: Child): DOMElement {
    if (typeof child === "string") {
        return document.createTextNode(child)
    } else if (child instanceof HTMLElement) {            
        return child
    } else if (child instanceof B.Observable) {
        let childElement: HTMLElement | Text = document.createTextNode("")
        child.forEach(value => {
            let newChildElement = createChildElement(value)
            childElement.parentNode?.replaceChild(newChildElement, childElement)
            childElement = newChildElement
        })
        return childElement
    } else {
        throw Error("Unknown child: " +child)
    }    
}