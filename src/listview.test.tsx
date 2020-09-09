import { h } from "./index"
import * as H from "./index"
import * as B from "baconjs"
import { testRender, htmlOf } from "./test-utils"
import { ListView } from "./listview"

type Item = { id: number, name: string}
const testItems: Item[] = [{ id: 1, name: "first" }]
const testItems2: Item[] = [{ id: 1, name: "first" }, { id: 2, name: "second" }]
describe("Listview", () => {
    it("With renderItem", () => testRender(testItems, (value, set) => {
        const el = <ul><ListView
            observable={value}
            renderItem={item => <li>{item.name}</li>}
        /></ul>
        expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
        set([])
        expect(htmlOf(el)).toEqual("<ul></ul>")
        set(testItems)
        expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
        return el
    }))

    it("With renderObservable", () => testRender(testItems, (value, set) => {
        const el = <ul><ListView
            observable={value}
            renderObservable={(key, item) => <li>{item.map(i => i.name)}</li>}
            getKey={item => item.id}
        /></ul>
        expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
        set([])
        expect(htmlOf(el)).toEqual("<ul></ul>")
        set(testItems)
        expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
        return el
    }))

    it("With renderObservable 2", () => testRender([] as Item[], (value, set) => {
        const el = <ul><ListView
            observable={value}
            renderObservable={(key, item) => <li>{item.map(i => i.name)}</li>}
            getKey={item => item.id}
        /></ul>
        expect(htmlOf(el)).toEqual("<ul></ul>")
        set(testItems2)
        expect(htmlOf(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
        set(testItems)
        expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
        set(testItems2)
        expect(htmlOf(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
        return el
    }))
})

// TODO: other variants, different transitions