import B from "baconjs"

export function createElement(type: string, props: Record<string, any>, ...children: any[]) {
    if (typeof type === "function") {
        const ctr = type as Function
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

function addChild(child: any, element: HTMLElement) {
    if (typeof child === "string") {
        element.appendChild(document.createTextNode(child))
    } else if (child instanceof HTMLElement) {            
        element.appendChild(child)
    } else if (child instanceof Array) {
        for (let c of child) {
            addChild(c, element)
        }
    } else {
        throw Error("Unknown child: " +child)
    }
}