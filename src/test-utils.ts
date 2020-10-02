import { h } from "./index"
import * as H from "./index"
import * as B from "baconjs"
import { DOMNode, unmount, callOnMounts, HarmajaOutput, HarmajaStaticOutput } from "./harmaja"

export function testRender<T>(init: T, test: (property: B.Property<T>, set: (v: T) => any) => HarmajaOutput) {
    const bus = new B.Bus<T>()
    const property = bus.toProperty(init)
    const element = test(property, bus.push)
    unmount(element as HarmajaStaticOutput)
    // Verify that all subscribers are removed on unmount
    expect((property as any).dispatcher.subscriptions.length).toEqual(0)
}

export function htmlOf(output: H.HarmajaOutput): string {
    const element = H.LowLevelApi.render(output)
    
    const parent = document.createElement("html")
    const root = document.createElement("div")
    parent.appendChild(root)

    H.mount(element, root)
    if (element instanceof Array) {
        return element.map(htmlOf).join("")
    } else {
        if (element instanceof HTMLElement) {
            return element.outerHTML;
        } else {
            return element.textContent || ""
        }
    }
}