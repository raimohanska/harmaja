import { h } from "./index"
import * as H from "./index"
import * as B from "baconjs"
import { testRender, htmlOf } from "./test-utils"
import { ListView } from "./listview"

type Item = { id: number, name: string}
const testItems: Item[] = [{ id: 1, name: "first" }]
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
})

// TODO: other variants, different transitions