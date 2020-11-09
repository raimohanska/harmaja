import { h, Fragment, mount, mountEvent, onMount, onUnmount, unmount, unmountEvent } from "./index"
import * as H from "./index"
import { renderAsString, getHtml, mounted, testRender } from "./test-utils"
import { HarmajaOutput } from "./harmaja"
import * as O from "./test-utils"

function body() {
    let body = <body/>
    let document = <html>{body}</html>
    return body as Element
}

describe("Harmaja", () => {
    it("Creating elements without JSX", () => {
        const el = H.createElement("h1", {}, "yes")
        expect(renderAsString(el)).toEqual("<h1>yes</h1>")
    })

    it("Supports refs", () => {
        let reffed: HTMLSpanElement | null = null;
        let span = <span id="x" ref={input => { reffed = input }}>Hello</span>
        let el = <div>{span}</div>
        expect(reffed).toEqual(null)
        mount(el, body())
        expect(reffed).toEqual(span)
        expect(() => <span id="x" ref={"not-a-function" as any}/>).toThrow("Expecting ref prop to be a function, got not-a-function")
    })

    it("Supports assigning standard and nonstandard attributes", () => {
        let span = <span draggable={true} data-test="my-test-id">Hello</span>
        mount(span, body())
        expect(renderAsString(span)).toEqual('<span draggable="true" data-test="my-test-id">Hello</span>')
    })

    it("Event handlers get registered", () => {
        let calls = 0
        let span = <span onClick={() => {calls++ }}>Hello</span>

        const mountedSpan = mount(span, body()) as HTMLSpanElement

        expect(calls).toEqual(0)

        mountedSpan.click()

        expect(calls).toEqual(1)
    })

    it("Can assign readonly props like select.form", () => {
        const formAndSelect = <div><form id="test-form"></form><select form="test-form" /></div>

        const mountedParentDiv = mount(formAndSelect, body()) as HTMLDivElement

        const form = mountedParentDiv.querySelector("form")!
        const select = mountedParentDiv.querySelector("select")!

        expect(select.form).toBe(form)

        expect(renderAsString(formAndSelect)).toEqual('<div><form id="test-form"></form><select form="test-form"></select></div>')
    })

    it("Boolean props like disabled work", () => {
        let calls = 0
        let button = <button disabled={true} onClick={() => {calls++ }} />

        const mountedButton = mount(button, body()) as HTMLButtonElement

        expect(calls).toEqual(0)

        mountedButton.click()

        expect(calls).toEqual(0)
    })

    it("Creating elements with JSX", () => {
        const el = <h1>yes</h1>
        expect(renderAsString(el)).toEqual("<h1>yes</h1>")
    })

    it("JSX Fragments", () => {
        const fragment = <><span>Hello</span><span>World</span></>
        expect(renderAsString(fragment)).toEqual("<span>Hello</span><span>World</span>")
    })

    it("Rendering observable string as child", () => testRender("yes", (value, set) => {
        const el = mounted(<h1>{value}</h1>)
        expect(getHtml(el)).toEqual("<h1>yes</h1>")
        set("no")
        expect(getHtml(el)).toEqual("<h1>no</h1>")
        set("definitely")
        expect(getHtml(el)).toEqual("<h1>definitely</h1>")
        return el
    }))

    it("renders observable HTMLElement as child", () => testRender(<input type="text"/> as HarmajaOutput | null, (value, set) => {
        const el = mounted(<h1>{value}</h1>)
        //console.log((el as any).outerHTML)
        expect(getHtml(el)).toEqual(`<h1><input type="text"></h1>`)
        set(null)
        expect(getHtml(el)).toEqual(`<h1></h1>`)
        set(<input type="checkbox"/>)
        expect(getHtml(el)).toEqual(`<h1><input type="checkbox"></h1>`)
        return el
    }))

    it("renders observable as prop", () => testRender("big", (value, set) => {
        const el = mounted(<h1 className={value}></h1>)
        expect(getHtml(el)).toEqual(`<h1 class="big"></h1>`)
        set("small")
        expect(getHtml(el)).toEqual(`<h1 class="small"></h1>`)
        set("yuuuge")
        expect(getHtml(el)).toEqual(`<h1 class="yuuuge"></h1>`)
        return el
    }))

    it("Accepted and rejected child types", () => {
        expect(renderAsString(<h1>{"asdf"}</h1>)).toEqual(`<h1>asdf</h1>`)
        expect(renderAsString(<h1>{42}</h1>)).toEqual(`<h1>42</h1>`)
        expect(renderAsString(<h1>{null}</h1>)).toEqual(`<h1></h1>`)
        expect(renderAsString(<h1>{["hell", "yeah"]}</h1>)).toEqual(`<h1>hellyeah</h1>`)
        expect(renderAsString(<h1>{["hell", <br/>]}</h1>)).toEqual(`<h1>hell<br></h1>`)
        expect(() => (<h1>{undefined}</h1>)).toThrow("undefined is not a valid element")
        /*
        // The following do not event compile
        expect(() => (<h1>{true}</h1>)).toThrow("true is not a valid element")
        expect(() => (<h1>{new Date()}</h1>)).toThrow()
        expect(() => (<h1>{({})}</h1>)).toThrow()
        */
    })

    it("Supports React-style short circuiting", () => {
        expect(renderAsString(<h1>{true && <p>asdf</p>}</h1>)).toEqual(`<h1><p>asdf</p></h1>`)
        expect(renderAsString(<h1>{false && <p>asdf</p>}</h1>)).toEqual(`<h1></h1>`)
    })

    describe("Components", () => {
        it("Renders component children", () => {
            const C1 = ({children}:{children?:any}) => <div>{children}</div>
            expect(renderAsString(<C1/>)).toEqual("<div></div>")
            expect(renderAsString(<C1>hello</C1>)).toEqual("<div>hello</div>")
            expect(renderAsString(<C1><a>wat</a>BOOM</C1>)).toEqual("<div><a>wat</a>BOOM</div>")
        })

        it("Deals with multiple elements from component function", () => {
            const Component = ({ things }: { things: string[] }) => things.map(t => <ul>{t}</ul>)
            expect(renderAsString(<Component things={["a", "b", "c"]}/>)).toEqual("<ul>a</ul><ul>b</ul><ul>c</ul>")
        })
    
        it("Replaces multiple elements correctly", () => {
            const Component = ({ things }: { things: O.Atom<string[]> }) => <ul>{O.map(things, ts => ts.map(t => <li>{t}</li>))}</ul>
            const things = O.atom(["a"])
            expect(renderAsString(<Component things={things}/>)).toEqual("<ul><li>a</li></ul>")
            things.set([])
            expect(renderAsString(<Component things={things}/>)).toEqual("<ul></ul>")
            things.set(["b", "d"])
            expect(renderAsString(<Component things={things}/>)).toEqual("<ul><li>b</li><li>d</li></ul>")
            things.set(["x"])
            expect(renderAsString(<Component things={things}/>)).toEqual("<ul><li>x</li></ul>")
        })

        describe("Observable as component output", () => {
            it("Rendering", () => testRender(<span>1</span>, (value, set) => {
                const Component = () => value
                const el = mounted(<div><Component/></div>)
                //console.log((el as any).outerHTML)
                expect(getHtml(el)).toEqual(`<div><span>1</span></div>`)
                set(<span>2</span>)
                expect(getHtml(el)).toEqual(`<div><span>2</span></div>`)
                return el
            }))

            it("Observable-in-observable", () => {
                const initial = ["init"]
                const inner = O.atom(["a","b"])
                const Component = () => O.map(inner, xs => xs.map(x => <span>{x}</span>))
                const outer = O.atom([1, initial as any])
                const c = mounted(<div>{outer}</div>)
                expect(getHtml(c)).toEqual("<div>1init</div>")
                outer.set([1, <Component/>])
                expect(getHtml(c)).toEqual("<div>1<span>a</span><span>b</span></div>")
                inner.set(["c", "d"])
                expect(getHtml(c)).toEqual("<div>1<span>c</span><span>d</span></div>")
                outer.set([1, 2])            
                expect(getHtml(c)).toEqual("<div>12</div>")
            })
            
            it("Lifecycle hooks", () => {
                let unmountCalled = 0    
                let mountCalled = 0
                
                
                const initial = ["init"]
                const inner = O.atom(["a","b"])
                const Component = () => { 
                    onUnmount(() => unmountCalled++)
                    onMount(() => mountCalled++)                    
                    unmountEvent().forEach(() => unmountCalled++)
                    mountEvent().forEach(() => mountCalled++)
                    return O.map(inner, xs => xs.map(x => <span>{x}</span>)) 
                }
                const outer = O.atom([1, initial as any])
                const c = mounted(<div>{outer}</div>)
                expect(getHtml(c)).toEqual("<div>1init</div>")
                expect(unmountCalled).toEqual(0)
                expect(mountCalled).toEqual(0)
    
                outer.set([1, <Component/>])
                expect(getHtml(c)).toEqual("<div>1<span>a</span><span>b</span></div>")
                expect(unmountCalled).toEqual(0)
                expect(mountCalled).toEqual(2) // 2 because both callback and eventstream
    
                inner.set(["c", "d"])
                expect(getHtml(c)).toEqual("<div>1<span>c</span><span>d</span></div>")
                
                outer.set([1, 2])            
                expect(getHtml(c)).toEqual("<div>12</div>")
                expect(unmountCalled).toEqual(2)
                expect(mountCalled).toEqual(2)    
            })            
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
            mounted(<body>{el}</body>)
            expect(unmountCalled).toEqual(0)
            expect(mountCalled).toEqual(2) // 2 because both callback and eventstream
            unmount(el)
            expect(unmountCalled).toEqual(2)
            expect(mountCalled).toEqual(2)
    
            expect(() => mount(el, body())).toThrow("Component re-mount not supported")
    
            expect(() => unmountEvent()).toThrow("Illegal unmountEvent call outside component constructor call")
        })
    })


    describe("Nested controllers", () => {
        it("Observable-in-observable", () => {
            const initial = ["init"]
            const inner = O.atom(["a","b"])
            const outer = O.atom([1, initial as any])
            const c = mounted(<div>{outer}</div>)
            expect(getHtml(c)).toEqual("<div>1init</div>")
            outer.set([1, inner])
            expect(getHtml(c)).toEqual("<div>1ab</div>")
            inner.set(["c", "d"])
            expect(getHtml(c)).toEqual("<div>1cd</div>")
            outer.set([1, 2])            
            expect(getHtml(c)).toEqual("<div>12</div>")
        })
    })

    it("Special - nested dependent", () => testRender(1, (value, set) => {
        const p = O.atom<number>(value, updated => console.log(updated))
        const el = mounted(<div>{O.map(p, () => <div>{p}</div>)}</div>)
        expect(getHtml(el)).toEqual("<div><div>1</div></div>")
        return el as any
    }))
})