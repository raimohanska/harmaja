import { h } from "./index"
import * as H from "./index"
import * as B from "./eggs/eggs"
import { DOMNode, unmount, callOnMounts, HarmajaOutput, HarmajaStaticOutput } from "./harmaja"
import { scope, toProperty } from "./eggs/eggs"

export function testRender<T>(init: T, test: (property: B.Property<T>, set: (v: T) => any) => HarmajaOutput) {
    const bus = B.bus<T>()
    const testScope = scope() 
    testScope.start()
    const property = toProperty(bus, init, testScope.apply)
    const element = test(property, bus.push)
    unmount(element as HarmajaStaticOutput)
    // Verify that all subscribers are removed on unmount
    testScope.end()
    expect((property as any).dispatcher.hasObservers()).toEqual(false)
}

export function mounted(element: H.HarmajaOutput) {    
    const parent = document.createElement("html")
    const root = document.createElement("div")
    parent.appendChild(root)

    H.mount(element, root)

    return element as HarmajaStaticOutput
}

export function renderAsString(output: H.HarmajaOutput): string {
    return getHtml(mounted(output))
}

export function getHtml(element: H.HarmajaStaticOutput): string {
    if (element instanceof Array) {
        return element.map(getHtml).join("")
    } else {
        if (element instanceof HTMLElement) {
            return element.outerHTML;
        } else {
            return element.textContent || ""
        }
    }
}