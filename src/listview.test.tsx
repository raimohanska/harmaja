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

    it("Allows only single-node items", () => {
        const el = <ul><ListView
            observable={B.constant([1])}
            renderItem={item => [<li>{item}</li>, <li/>]}
        /></ul>
        expect(() => htmlOf(el)).toThrow("Only single-element results supported in ListView. Got [object HTMLLIElement],[object HTMLLIElement]")
    })

    describe("With renderObservable", () => {
        it("Non-empty -> empty -> Non-empty", () => testRender(testItems, (value, set) => {
            const el = <ul><ListView
                observable={value}
                renderObservable={(key, item) => <li>{item.map(i => i.name)}</li>}
                getKey={item => item.id}
            /></ul>
            htmlOf(el)
            expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
            set([])
            expect(htmlOf(el)).toEqual("<ul></ul>")
            set(testItems)
            expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
            return el
        }))    

        it("Re-using nodes", () => testRender([] as Item[], (value, set) => {
            let renderedIds: number[] = []
            const el = <ul><ListView
                observable={value}
                renderObservable={(id: number, item) => {
                    renderedIds.push(id)
                    return <li>{item.map(i => i.name)}</li>
                }}
                getKey={item => item.id}
            /></ul>
            expect(htmlOf(el)).toEqual("<ul></ul>")
            set(testItems2)
            expect(htmlOf(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            expect(renderedIds).toEqual([1, 2]) // Render both items once first
            set(testItems)
            expect(htmlOf(el)).toEqual("<ul><li>first</li></ul>")
            expect(renderedIds).toEqual([1, 2]) // re-using existing component "first"
            set(testItems2)
            expect(htmlOf(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            expect(renderedIds).toEqual([1, 2, 2]) // re-using existing component "first", rendering "second" again, because it was not present on previous rendering round.
            return el
        }))
    })

    describe("Observable-in-ListView", () => {
        it("Works", () => testRender(1, (value, set) => {
            const listView = <ul><ListView 
                observable = { B.constant([1, 2, 3]) }
                renderItem = { item => B.constant(<li>{value.map(v => v * item)}</li>) }
            /></ul>
            expect(htmlOf(listView)).toEqual("<ul><li>1</li><li>2</li><li>3</li></ul>")
            set(2)
            expect(htmlOf(listView)).toEqual("<ul><li>2</li><li>4</li><li>6</li></ul>")
            return listView
        }))

        it.only("Allows only single-node items", () => {
            const listView = <ul><ListView 
                observable = { B.constant([1]) }
                renderItem = { item => B.constant([<div/>, <div/>]) }
            /></ul>

            expect(() => htmlOf(listView)).toThrow("Only single-element results supported in ListView. Got [object HTMLDivElement],[object HTMLDivElement]")
        })
    })

    describe("Listview-in-Observable", () => {
        it ("Simplest", () => {
            const items = H.atom([1,2,3])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = H.atom([0, inner, 2])
            const c = <div>{outer}</div>
            expect(htmlOf(c)).toEqual("<div>0<span>1</span><span>2</span><span>3</span>2</div>") 
            outer.set([0, 2])
            expect(htmlOf(c)).toEqual("<div>02</div>") 
        })

        it ("Replacing whole list", () => {
            const items = H.atom([1,2,3])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = H.atom([0, inner, 2])
            const c = <div>{outer}</div>
            expect(htmlOf(c)).toEqual("<div>0<span>1</span><span>2</span><span>3</span>2</div>") 
            items.set([4,5,6])
            expect(htmlOf(c)).toEqual("<div>0<span>4</span><span>5</span><span>6</span>2</div>") 
            outer.set([0, 2])
            expect(htmlOf(c)).toEqual("<div>02</div>") 
        })
        it ("Removing some elements", () => {
            const items = H.atom([1,2,3])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = H.atom([0, inner, 2])
            const c = <div>{outer}</div>
            expect(htmlOf(c)).toEqual("<div>0<span>1</span><span>2</span><span>3</span>2</div>") 
            items.set([1])
            expect(htmlOf(c)).toEqual("<div>0<span>1</span>2</div>") 
            outer.set([0, 2])
            expect(htmlOf(c)).toEqual("<div>02</div>") 
        })
        it ("Adding some elements", () => {
            const items = H.atom([1])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = H.atom([0, inner, 2])
            const c = <div>{outer}</div>
            expect(htmlOf(c)).toEqual("<div>0<span>1</span>2</div>") 
            items.set([1, 2])
            expect(htmlOf(c)).toEqual("<div>0<span>1</span><span>2</span>2</div>") 
            outer.set([0, 2])
            expect(htmlOf(c)).toEqual("<div>02</div>") 
        })
        it ("Empty->Non-empty->Empty", () => {
            const items = H.atom([] as number[])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = H.atom([0, inner, 2])
            const c = <div>{outer}</div>
            expect(htmlOf(c)).toEqual("<div>02</div>") 
            items.set([4,5,6])
            expect(htmlOf(c)).toEqual("<div>0<span>4</span><span>5</span><span>6</span>2</div>") 
            items.set([])
            expect(htmlOf(c)).toEqual("<div>02</div>") 
            outer.set([0, 2])
            expect(htmlOf(c)).toEqual("<div>02</div>") 
        })
    })
})