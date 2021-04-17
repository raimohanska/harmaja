import { h } from "./index"
import * as O from "./test-utils"
import { testRender, mounted, getHtml, atom } from "./test-utils"
import { ListView } from "./listview"
import { observablesImplementationName } from "./observable/observables"
import * as L from "lonna"
import { componentScope } from "./harmaja"

type Item = { id: number, name: string}
const firstItem = { id: 1, name: "first" }
const secondItem = { id: 2, name: "second" }
const testItems: Item[] = [firstItem]
const testItems2: Item[] = [firstItem, secondItem]
const testItems3: Item[] = [secondItem]
const isRx = observablesImplementationName === "RxJs"

describe("Listview", () => {
    it("Renders Observables as children", () => testRender(testItems, (value, set) => {
        const el = mounted(<ul><ListView
            observable={value}
            renderItem={item => { 
                return O.atom(item.name)
            }}
        /></ul>)
        expect(getHtml(el)).toEqual("<ul>first</ul>")
        return el
    }))
    describe("With renderItem", () => {
        it("Without getKey", () => testRender(testItems, (value, set) => {
            let renderedIds: number[] = [];
            const el = mounted(<ul><ListView
                observable={value}
                renderItem={item => { 
                    renderedIds.push(item.id)
                    return <li>{item.name}</li> 
                }}
            /></ul>)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            expect(renderedIds).toEqual([1])
            set([])
            expect(getHtml(el)).toEqual("<ul></ul>")
            
            set(testItems)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            expect(renderedIds).toEqual([1, 1])
    
            set(testItems2)
            expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            if (!isRx) expect(renderedIds).toEqual([1, 1, 2])
    
            set([])
            expect(getHtml(el)).toEqual("<ul></ul>")
    
            set(testItems)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            if (!isRx) expect(renderedIds).toEqual([1, 1, 2, 1])
    
            set([])
            expect(getHtml(el)).toEqual("<ul></ul>")
    
            set(testItems2)
            expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            if (!isRx) expect(renderedIds).toEqual([1, 1, 2, 1, 1, 2])

            set([{ id: 1, name: "first-modified" }, secondItem])
            expect(getHtml(el)).toEqual("<ul><li>first-modified</li><li>second</li></ul>")            
            if (!isRx) expect(renderedIds).toEqual([1, 1, 2, 1, 1, 2, 1])
            return el
        }))
        it("With getKey", () => testRender(testItems, (value, set) => {
            let renderIds: number[] = [];
            const el = mounted(<ul><ListView
                observable={value}
                renderItem={item => { 
                    renderIds.push(item.id)
                    return <li>{item.name}</li> 
                }}
                getKey={item => item.id}
            /></ul>)      
            
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
            expect(renderIds).toEqual([1])

            set(testItems2)
            expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            if (!isRx) expect(renderIds).toEqual([1, 2])

            set([{ id: 1, name: "first-modified" }, secondItem])            
            expect(getHtml(el)).toEqual("<ul><li>first-modified</li><li>second</li></ul>")            
            if (!isRx) expect(renderIds).toEqual([1, 2, 1])

            set([secondItem])            
            expect(getHtml(el)).toEqual("<ul><li>second</li></ul>")            
            if (!isRx) expect(renderIds).toEqual([1, 2, 1])

            return el
        }))
    })

    it("Allows only single-node items on list", () => {        
        if (observablesImplementationName === "RxJs") {
            console.log(`Skipping test because Observables cannot throw errors with ${observablesImplementationName}`)
            return
        }
        expect(() => mounted(<ul><ListView
            observable={O.constant([1])}
            renderItem={item => [<li>{item}</li>, <li/>]}
        /></ul>)).toThrow("Only single-element results supported in ListView. Got [object HTMLLIElement],[object HTMLLIElement]")
    })

    describe("With renderAtom", () => {
        it("Works", () => {
            const a = atom(testItems)
            const el = mounted(<ul><ListView
                atom={a}
                renderAtom={(key, item) => { 
                    return <li>{O.map(item, i => i.name)}</li>}}
                getKey={item => item.id}
            /></ul>)
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
        })

        it("remove() works", () => {
            const a = atom(testItems2)
            let removeCallback: (() => void) | null = null
            const el = mounted(<ul><ListView
                atom={a}
                renderAtom={(key, item, remove) => {
                    if (key === 2) removeCallback = remove
                    return <li>{O.map(item, i => i.name)}</li>}}
                getKey={item => item.id}
            /></ul>)
            expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
            expect(removeCallback).not.toBeNull()
            removeCallback!()
            expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
        })
    })

    describe("With renderObservable", () => {
        it("Non-empty -> empty -> Non-empty", () => testRender(testItems, (value, set) => {
            const el = mounted(<ul><ListView
                observable={value}
                renderObservable={(_, item) => <li>{O.map(item, i => i.name)}</li>}
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

        describe("Re-using nodes", () => {
            const items1: Item[] = [{ id: 1, name: "first" }]
            const items2: Item[] = [{ id: 2, name: "second" }]
            const items12: Item[] = [{ id: 1, name: "first" }, { id: 2, name: "second" }]
            const items23: Item[] = [{ id: 2, name: "second" }, { id: 3, name: "third" }]
            const items123: Item[] = [{ id: 1, name: "first" }, { id: 2, name: "second" }, { id: 3, name: "third" }]
            const items213: Item[] = [{ id: 2, name: "second" }, { id: 1, name: "first" }, { id: 3, name: "third" }]
            const items342: Item[] = [{ id: 3, name: "third" }, { id: 4, name: "fourth" }, { id: 2, name: "second" }]

            let renderedIds: number[] = []
            beforeEach(() => {
                renderedIds = []
            })

            const make = (value: O.Property<Item[]>) =>
                mounted(<ul><ListView
                    observable={value}
                    renderObservable={(id: number, item) => {
                        renderedIds.push(id)
                        return <li>{O.map(item, i => i.name)}</li>
                    }}
                    getKey={item => item.id}
                /></ul>)

            it("When adding items", () => testRender([] as Item[], (value, set) => {
                const el = make(value)
                expect(getHtml(el)).toEqual("<ul></ul>")
                set(items12)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
                expect(renderedIds).toEqual([1, 2]) // Render both items once first
                set(items1)
                expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
                expect(renderedIds).toEqual([1, 2]) // re-using existing component "first"
                set(items12)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
                expect(renderedIds).toEqual([1, 2, 2]) // re-using existing component "first", rendering "second" again, because it was not present on previous rendering round.
                return el
            }))

            it("When deleting items", () => testRender(items123, (value, set) => {
                const el = make(value)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li><li>third</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Render all items once first
                set(items23)
                expect(getHtml(el)).toEqual("<ul><li>second</li><li>third</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Nothing should be rendered when removing the first item
                set(items2)
                expect(getHtml(el)).toEqual("<ul><li>second</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Nothing should be rendered when removing the last item
                return el
            }))

            it("When reordering items", () => testRender(items123, (value, set) => {
                const el = make(value)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li><li>third</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Render all items once first
                set(items213)
                expect(getHtml(el)).toEqual("<ul><li>second</li><li>first</li><li>third</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Nothing should be rendered when reordering items
                return el
            }))

            it("When adding, deleting and reordering items", () => testRender(items123, (value, set) => {
                const el = make(value)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li><li>third</li></ul>")
                // expect(renderedIds).toEqual([1, 2, 3]) // Render all items once first
                set(items342)
                expect(getHtml(el)).toEqual("<ul><li>third</li><li>fourth</li><li>second</li></ul>")
                // expect(renderedIds).toEqual([1, 2, 3]) // Nothing should be rendered when reordering and deleting
                return el
            }))
        })

        describe("Re-using nodes with index-based keying", () => {
            const items1: Item[] = [{ id: 1, name: "first" }]
            const items2: Item[] = [{ id: 2, name: "second" }]
            const items12: Item[] = [{ id: 1, name: "first" }, { id: 2, name: "second" }]
            const items23: Item[] = [{ id: 2, name: "second" }, { id: 3, name: "third" }]
            const items123: Item[] = [{ id: 1, name: "first" }, { id: 2, name: "second" }, { id: 3, name: "third" }]

            let renderedIds: number[] = []
            beforeEach(() => {
                renderedIds = []
            })

            const make = (value: O.Property<Item[]>) =>
                mounted(<ul><ListView
                    observable={value}
                    renderObservable={(id: number, item) => {
                        renderedIds.push(id)
                        return <li>{O.map(item, i => i.name)}</li>
                    }}
                    getKey={(item, index) => index + 1}
                /></ul>)

            it("When adding items", () => testRender([] as Item[], (value, set) => {
                const el = make(value)
                expect(getHtml(el)).toEqual("<ul></ul>")
                set(items12)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
                expect(renderedIds).toEqual([1, 2]) // Render both items once first
                set(items1)
                expect(getHtml(el)).toEqual("<ul><li>first</li></ul>")
                expect(renderedIds).toEqual([1, 2]) // re-using existing component "first"
                set(items12)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li></ul>")
                expect(renderedIds).toEqual([1, 2, 2]) // re-using existing component "first", rendering "second" again, because it was not present on previous rendering round.
                return el
            }))

            it("When deleting items", () => testRender(items123, (value, set) => {
                const el = make(value)
                expect(getHtml(el)).toEqual("<ul><li>first</li><li>second</li><li>third</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Render all items once first
                set(items23)
                expect(getHtml(el)).toEqual("<ul><li>second</li><li>third</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Nothing should be rendered when removing items, existing items are recycled based on index
                set(items2)
                expect(getHtml(el)).toEqual("<ul><li>second</li></ul>")
                expect(renderedIds).toEqual([1, 2, 3]) // Nothing should be rendered when removing the last item
                return el
            }))            
        })
    })

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
            if (observablesImplementationName === "RxJs") {
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


