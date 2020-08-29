import { h } from "./index"
import * as H from "./index"
import * as B from "baconjs"
import { testRender, htmlOf } from "./test-utils"
import { onUnmount, onMount, mount , unmount, unmountEvent, mountEvent } from "./harmaja"

function body() {
    let body = <body/>
    let document = <html>{body}</html>
    return body
}

describe("Harmaja", () => {
    it("Creating elements without JSX", () => {
        const el = H.createElement("h1", {}, "yes")
        expect(htmlOf(el)).toEqual("<h1>yes</h1>")
    })

    it("Lifecycle hooks", () => {
        let unmountCalled = 0    
        let mountCalled = 0
        const Component = () => {
            onUnmount(() => unmountCalled++)
            onMount(() => mountCalled++)
            unmountEvent().forEach(() => unmountCalled++)
            mountEvent().forEach(() => mountCalled++)
            return <div>Teh component</div>
        }
        const el = <Component/>
        expect(unmountCalled).toEqual(0)
        expect(mountCalled).toEqual(0)
        mount(el, body())
        expect(unmountCalled).toEqual(0)
        expect(mountCalled).toEqual(2) // 2 because both callback and eventstream
        unmount(el)
        expect(unmountCalled).toEqual(2)
        expect(mountCalled).toEqual(2)
    })

    it("Supports refs", () => {
        let reffed: HTMLSpanElement | null = null;
        let span = <span id="x" ref={input => { reffed = input }}>Hello</span>
        let el = <div>{span}</div>
        expect(reffed).toEqual(null)
        mount(el, body())
        expect(reffed).toEqual(span)
        expect(() => <span id="x" ref="not-a-function"/>).toThrow("Expecting ref prop to be a function, got not-a-function")
    })

    it("Creating elements with JSX", () => {
        const el = <h1>yes</h1>
        expect(htmlOf(el)).toEqual("<h1>yes</h1>")
    })

    it("Rendering observable string as child", () => testRender("yes", (value, set) => {
        const el = <h1>{value}</h1>
        expect(htmlOf(el)).toEqual("<h1>yes</h1>")
        set("no")
        expect(htmlOf(el)).toEqual("<h1>no</h1>")
        set("definitely")
        expect(htmlOf(el)).toEqual("<h1>definitely</h1>")
        return el
    }))

    it("renders observable HTMLElement as child", () => testRender(<input type="text"/> as HTMLElement | null, (value, set) => {
        const el = <h1>{value}</h1>
        //console.log((el as any).outerHTML)
        expect(htmlOf(el)).toEqual(`<h1><input type="text"></h1>`)
        set(null)
        expect(htmlOf(el)).toEqual(`<h1></h1>`)
        set(<input type="checkbox"/>)
        expect(htmlOf(el)).toEqual(`<h1><input type="checkbox"></h1>`)
        return el
    }))

    it("renders observable as prop", () => testRender("big", (value, set) => {
        const el = <h1 className={value}></h1>
        expect(htmlOf(el)).toEqual(`<h1 class="big"></h1>`)
        set("small")
        expect(htmlOf(el)).toEqual(`<h1 class="small"></h1>`)
        set("yuuuge")
        expect(htmlOf(el)).toEqual(`<h1 class="yuuuge"></h1>`)
        return el
    }))

    it("Accepted and rejected child types", () => {
        expect(htmlOf(<h1>{"asdf"}</h1>)).toEqual(`<h1>asdf</h1>`)
        expect(htmlOf(<h1>{42}</h1>)).toEqual(`<h1>42</h1>`)
        expect(htmlOf(<h1>{null}</h1>)).toEqual(`<h1></h1>`)
        expect(htmlOf(<h1>{["hell", "yeah"]}</h1>)).toEqual(`<h1>hellyeah</h1>`)
        expect(htmlOf(<h1>{["hell", <br/>]}</h1>)).toEqual(`<h1>hell<br></h1>`)
        expect(() => (<h1>{undefined}</h1>)).toThrow("undefined is not a valid element")
        expect(() => (<h1>{true}</h1>)).toThrow("true is not a valid element")
        expect(() => (<h1>{new Date()}</h1>)).toThrow()
        expect(() => (<h1>{({})}</h1>)).toThrow()
    })
})