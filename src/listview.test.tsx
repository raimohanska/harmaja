import { h } from "./index"
import * as O from "./test-utils"
import { testRender, mounted, getHtml } from "./test-utils"
import { ListView } from "./listview"
import { observablesImplementationName, observablesThrowError } from "./observable/observables"

type Item = { id: number, name: string}
const testItems: Item[] = [{ id: 1, name: "first" }]
const testItems2: Item[] = [{ id: 1, name: "first" }, { id: 2, name: "second" }]
const testItems3: Item[] = [{ id: 2, name: "second" }]

describe("Listview", () => {
    it("With renderItem", () => testRender(testItems, (value, set) => {
        const el = mounted(<ul><ListView
            observable={value}
            renderItem={item => <li>{item.name}</li>}
        /></ul>)
        expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
        set([])
        expect(getHtml(el)).toEqual("<ul></ul>")
        
        set(testItems)
        expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")

        set(testItems2)
        expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")

        set([])
        expect(getHtml(el)).toEqual("<ul></ul>")

        set(testItems)
        expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")

        set([])
        expect(getHtml(el)).toEqual("<ul></ul>")

        set(testItems2)
        expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
        return el
    }))

    it("Allows only single-node items on list", () => {        
        if (!observablesThrowError) {
            console.log(`Skipping test because Observables cannot throw errors with ${observablesImplementationName}`)
            return
        }
        expect(() => mounted(<ul><ListView
            observable={O.constant([1])}
            renderItem={item => [<li>{item}</li>, <li/>]}
        /></ul>)).toThrow("Only single-element results supported in ListView. Got [object HTMLLIElement],[object HTMLLIElement]")
    })

    describe("With renderObservable", () => {
        it("Non-empty -> empty -> Non-empty", () => testRender(testItems, (value, set) => {
            const el = mounted(<ul><ListView
                observable={value}
                renderObservable={(key, item) => { 
                    return <li>{O.map(item, i => i.name)}</li>}}
                getKey={item => item.id}
            /></ul>)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            set(testItems2)
            expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            set(testItems)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            set([])
            expect(getHtml(el)).toEqual("<ul></ul>")
            set(testItems)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            return el
        }))    

        it("Re-using nodes", () => testRender([] as Item[], (value, set) => {
            let renderedIds: number[] = []
            const el = mounted(<ul><ListView
                observable={value}
                renderObservable={(id: number, item) => {
                    renderedIds.push(id)
                    return <li>{O.map(item, i => i.name)}</li>
                }}
                getKey={item => item.id}
            /></ul>)
            expect(getHtml(el)).toEqual("<ul></ul>")
            set(testItems2)
            expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            expect(renderedIds).toEqual([1, 2]) // Render both items once first
            set(testItems)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            expect(renderedIds).toEqual([1, 2]) // re-using existing component "first"
            set(testItems2)
            expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            expect(renderedIds).toEqual([1, 2, 2]) // re-using existing component "first", rendering "second" again, because it was not present on previous rendering round.
            return el
        }))
    })

    // TODO renderAtom test

    describe("Observable-in-ListView", () => {
        it("Changing item value contents", () => testRender(1, (value, set) => {
            const listView = mounted(<ul><ListView 
                observable = { O.constant([1, 2, 3]) }
                renderItem = { item => O.constant(<li>{O.map(value, v => v * item)}</li>) }
            /></ul>)
            expect(getHtml(listView)).toEqual("<ul><li>1</li><li>2</li><li>3</li></ul>")
            set(2)
            expect(getHtml(listView)).toEqual("<ul><li>2</li><li>4</li><li>6</li></ul>")
            return listView
        }))

        it("Changing item values", () => testRender(1, (value, set) => {
            const listView = mounted(<ul><ListView 
                observable = { O.constant([1, 2, 3]) }
                renderItem = { item => O.map(value, v => <li>{v * item}</li>) }
            /></ul>)
            expect(getHtml(listView)).toEqual("<ul><li>1</li><li>2</li><li>3</li></ul>")
            set(2)
            expect(getHtml(listView)).toEqual("<ul><li>2</li><li>4</li><li>6</li></ul>")
            return listView
        }))

        it("Changing item list only", () => testRender([1], (value, set) => {
            const listView = mounted(<ul><ListView 
                observable = { value }
                renderItem = { item => O.constant(<li>{item}</li>) }
            /></ul>)
            expect(getHtml(listView)).toEqual("<ul><li>1</li></ul>")
            set([1,2])
            expect(getHtml(listView)).toEqual("<ul><li>1</li><li>2</li></ul>")
            set([1,8])
            expect(getHtml(listView)).toEqual("<ul><li>1</li><li>8</li></ul>")
            set([1,2,3])
            expect(getHtml(listView)).toEqual("<ul><li>1</li><li>2</li><li>3</li></ul>")
            return listView
        }))

        it("Allows only single-node items", () => {
            if (!observablesThrowError) {
                console.log(`Skipping test because Observables cannot throw errors with ${observablesImplementationName}`)
                return
            }    
            expect(() => mounted(<ul><ListView 
                observable = { O.constant([1]) }
                renderItem = { item => O.constant([<div/>, <div/>]) }
            /></ul>)).toThrow("Only single-element results supported in ListView. Got [object HTMLDivElement],[object HTMLDivElement]")
        })
    })

    describe("Listview-in-Observable", () => {
        it ("Simplest", () => {
            const items = O.atom([1,2,3])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = O.atom([0, inner, 2])
            const c = mounted(<div>{outer}</div>)
            expect(getHtml(c)).toEqual("<div>0<span>1</span><span>2</span><span>3</span>2</div>") 
            outer.set([0, 2])
            expect(getHtml(c)).toEqual("<div>02</div>") 
        })

        it ("Replacing whole list", () => {
            const items = O.atom([1,2,3])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = O.atom([0, inner, 2])
            const c = mounted(<div>{outer}</div>)
            expect(getHtml(c)).toEqual("<div>0<span>1</span><span>2</span><span>3</span>2</div>") 
            items.set([4,5,6])
            expect(getHtml(c)).toEqual("<div>0<span>4</span><span>5</span><span>6</span>2</div>") 
            outer.set([0, 2])
            expect(getHtml(c)).toEqual("<div>02</div>") 
        })
        it ("Removing some elements", () => {
            const items = O.atom([1,2,3])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = O.atom([0, inner, 2])
            const c = mounted(<div>{outer}</div>)
            expect(getHtml(c)).toEqual("<div>0<span>1</span><span>2</span><span>3</span>2</div>") 
            items.set([1])
            expect(getHtml(c)).toEqual("<div>0<span>1</span>2</div>") 
            outer.set([0, 2])
            expect(getHtml(c)).toEqual("<div>02</div>") 
        })
        it ("Adding some elements", () => {
            const items = O.atom([1])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = O.atom([0, inner, 2])
            const c = mounted(<div>{outer}</div>)
            expect(getHtml(c)).toEqual("<div>0<span>1</span>2</div>") 
            items.set([1, 2])
            expect(getHtml(c)).toEqual("<div>0<span>1</span><span>2</span>2</div>") 
            outer.set([0, 2])
            expect(getHtml(c)).toEqual("<div>02</div>") 
        })
        it ("Empty->Non-empty->Empty", () => {
            const items = O.atom([] as number[])
            const inner = <ListView observable={items} renderItem={i => <span>{i}</span>}/>
            const outer = O.atom([0, inner, 2])
            const c = mounted(<div>{outer}</div>)
            expect(getHtml(c)).toEqual("<div>02</div>") 
            items.set([4,5,6])
            expect(getHtml(c)).toEqual("<div>0<span>4</span><span>5</span><span>6</span>2</div>") 
            items.set([])
            expect(getHtml(c)).toEqual("<div>02</div>") 
            outer.set([0, 2])
            expect(getHtml(c)).toEqual("<div>02</div>") 
        })
    })

    describe("Nested ListViews", () => {
        const make = (value: O.Property<number[][]>) => mounted(
            <ul>
                <ListView
                    observable={value}
                    getKey={() => 0}
                    renderObservable={(_, items) => (
                        <li>
                            <ListView
                                observable={items}
                                getKey={item => item}
                                renderObservable={(_, item) =>
                                    // Does not work:
                                    O.map(item, x => <span>{x}</span>)
                                    // Works:
                                    // <span>{item}</span>
                                }
                            />
                       </li>
                    )}
                />
            </ul>
        )
        it("Observable-in-ListView, add 1 item", () => testRender([[1]], (value, set) => {
            const el = make(value)
            expect(getHtml(el)).toEqual("<ul><li><span>1</span></li></ul>")
            // Adding 1 item works
            set([[1, 2]])
            expect(getHtml(el)).toEqual("<ul><li><span>1</span><span>2</span></li></ul>")
            // Adding the second doesn't add anything => this fails
            set([[1, 2, 3]])
            expect(getHtml(el)).toEqual("<ul><li><span>1</span><span>2</span><span>3</span></li></ul>")
            return el
        }))
        it("Observable-in-ListView, add 2 items", () => testRender([[1]], (value, set) => {
            const el = make(value)
            expect(getHtml(el)).toEqual("<ul><li><span>1</span></li></ul>")
            // Adding 2 items right away crashes
            set([[1, 2, 3]])
            expect(getHtml(el)).toEqual("<ul><li><span>1</span><span>2</span><span>3</span></li></ul>")
            return el
        }))
    })
})
