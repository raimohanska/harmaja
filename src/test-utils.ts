import { HarmajaOutput, HarmajaStaticOutput, mount, unmount } from "./harmaja"
import { atomFromValue, Bus, Signal } from "./signal"

export function mounted(element: HarmajaOutput) {
    const parent = document.createElement("html")
    const root = document.createElement("div")
    parent.appendChild(root)

    mount(element, root)

    return element as HarmajaStaticOutput
}

export function renderAsString(output: HarmajaOutput): string {
    return getHtml(mounted(output))
}

export function getHtml(element: HarmajaStaticOutput): string {
    if (element instanceof Array) {
        return element.map(getHtml).join("")
    } else {
        if (element instanceof HTMLElement) {
            return element.outerHTML
        } else {
            return element.textContent || ""
        }
    }
}
export function wait(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay))
}

export function testRender<T>(
    init: T,
    test: (property: Signal<T>, set: (v: T) => any) => HarmajaOutput
) {
    const atom = atomFromValue(init)
    const element = test(atom, atom.set)
    unmount(element as HarmajaStaticOutput)
    // TODO Verify that all subscribers are removed on unmount
}
