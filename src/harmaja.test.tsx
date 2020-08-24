import { h } from "./index"
import * as H from "./index"
import * as B from "baconjs"
import { DOMElement, removeElement } from "./harmaja"
import { testRender, htmlOf } from "./test-utils"

describe("Harmaja", () => {
    it("Creating elements without JSX", () => {
        const el = H.createElement("h1", {}, "yes")
        expect(htmlOf(el)).toEqual("<h1>yes</h1>")
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