import B from "baconjs"

export function createElement(type: string, props: Record<string, any>, ...children: any[]) {
    const element = document.createElement(type)
    for (const [key, value] of Object.entries(props || {})) {
        (element as any)[key] = value
    }
    for (const child of children) {
        if (typeof child === "string") {
            element.appendChild(document.createTextNode(child))
        } else {            
            element.appendChild(child)
        }
    }
    return element
}