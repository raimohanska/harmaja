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

    describe("refs", () => {
        it("Throws if a string is passed as a ref", () => {
            expect(() => <span id="x" ref={"not-a-function" as any}/>).toThrow("Expecting ref prop to be an atom or a function, got not-a-function")
        })

        it("Function ref is not called before mounting", () => {
            // setting to false with an any cast to get in a value that should never occur really
            let reffed: HTMLSpanElement  | null = false as any;
            let span = <span id="x" ref={input => { reffed = input }}>Hello</span>
            expect(reffed).toEqual(false)
        })

        it("function ref is called with element ref when mounted", () => {
            let reffed: HTMLSpanElement | null = null;
            let span = <span id="x" ref={input => { reffed = input }}>Hello</span>
            let el = <div>{span}</div>
            mount(el, body())
            expect(reffed).toEqual(span)
        })

        it("function ref is not called when unmounted", () => {
            let reffed: HTMLSpanElement | null = null;
            let span = <span id="x" ref={input => { reffed = input }}>Hello</span>
            let el = <div>{span}</div>
            mount(el, body())
            unmount(el)
            expect(reffed).toEqual(span)
        })

        it("atom ref is set to null when assigned to an eleement", () => {
            // setting to false with an any cast to get in a value that should never occur really
            let reffed: O.Atom<HTMLSpanElement | null> = O.atom(false as any);
            let span = <span id="x" ref={reffed}>Hello</span>
            let el = <div>{span}</div>
            expect(reffed.get()).toEqual(null)
        })

        it("atom ref is set with the element when mounted", () => {
            let reffed: O.Atom<HTMLSpanElement | null> = O.atom(null);
            let span = <span id="x" ref={reffed}>Hello</span>
            let el = <div>{span}</div>
            mount(el, body())
            expect(reffed.get()).toEqual(span)
        })

        it("atom ref is set to null when unmounted", () => {
            // setting to false with an any cast to get in a value that should never occur really
            let reffed: O.Atom<HTMLSpanElement | null> = O.atom(false as any);
            let span = <span id="x" ref={reffed}>Hello</span>
            let el = <div>{span}</div>
            mount(el, body())
            unmount(el)
            expect(reffed.get()).toEqual(null)
        })
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

    it("Boolean props like disabled work", () => {
        let calls = 0
        let button = <button disabled={true} onClick={() => {calls++ }} />

        const mountedButton = mount(button, body()) as HTMLButtonElement

        expect(calls).toEqual(0)

        mountedButton.click()

        expect(calls).toEqual(0)
    })

    it("Registers dblclick handler properly -- JSX attribute name is onDoubleClick, native property is ondblclick", () => {
        let calls = 0
        let button = <button disabled={true} onDoubleClick={() => {calls++ }} />

        const mountedButton = mount(button, body()) as HTMLButtonElement

        expect(calls).toEqual(0)

        const clickEvent  = document.createEvent("MouseEvents")
        clickEvent.initEvent("dblclick")
        mountedButton.dispatchEvent(clickEvent)
        expect(calls).toEqual(1)
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
        set("")
        expect(getHtml(el)).toEqual("<h1></h1>")
        set("back")
        expect(getHtml(el)).toEqual("<h1>back</h1>")
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

    describe("element style", () => {
        it("Supports setting and unsetting style attributes", () => testRender({display: "inline"} as Record<string, string>, (style, setStyle) => {
            const el = mounted(<span style={style}/>) as HTMLSpanElement
            expect(el.style.display).toEqual("inline")
            expect(el.style.border).toEqual("")
            setStyle({display:"block", border: "1px solid black"})
            expect(el.style.display).toEqual("block")
            expect(el.style.border).toEqual("1px solid black")
            expect(el.style.borderBottom).toEqual("1px solid black")
            setStyle({})
            expect(el.style.display).toEqual("")
            expect(el.style.border).toEqual("")
            expect(el.style.borderBottom).toEqual("")
            return el
        }))
    })

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

    describe("Elements with contentEditable", () => {
        it("With Observable inside", () => {
            const value = O.atom("asdf")
            let el: HTMLSpanElement | null = null 
            const c = mounted(<span ref={e => el = e} contentEditable={true}>{value}</span>)
            expect(getHtml(c)).toEqual(`<span contenteditable="true">asdf</span>`)
            value.set("qwer")
            expect(getHtml(c)).toEqual(`<span contenteditable="true">qwer</span>`)
            el!.textContent = "new"
            expect(getHtml(c)).toEqual(`<span contenteditable="true">new</span>`)
            el!.textContent = ""
            expect(getHtml(c)).toEqual(`<span contenteditable="true"></span>`)
            value.set("BOOM")
            expect(getHtml(c)).toEqual(`<span contenteditable="true">BOOM</span>`)
        })
        it("With more stuff inside", () => {
            const value = O.atom("asdf")
            expect(() => mounted(<span contentEditable={true}>{value}moreStuff</span>)).toThrow("contentEditable elements expected to contain zero to one child")            
        })
        it("With empty body", () => {
            const c = mounted(<span contentEditable={true}></span>)
            expect(getHtml(c)).toEqual(`<span contenteditable="true"></span>`)
        })
        it("With contentEditable=false", () => {
            const c = mounted(<span contentEditable={false}>HOLA</span>)
            expect(getHtml(c)).toEqual(`<span contenteditable="false">HOLA</span>`)
        })
    })

    const MEANING_OF_LIFE = H.createContext<number>("MEANING_OF_LIFE");

    describe("Context", () => {
        it("Static usage", () => {
            const c = mounted(<ComponentWithStaticContextUsage/>)
            expect(getHtml(c)).toEqual(`<div id="parent"><label>meaning: 42</label></div>`)
        })
        it("Dynamic usage", () => testRender("meaning", (value, set) => {
            const c = mounted(<ComponentWithDynamicContextUsage label={value}/>)
            expect(getHtml(c)).toEqual(`<div id="parent"><label>meaning: 42</label></div>`)
            return c
        }))
        it("Not supported for components that yield a Property", () => {
            expect(() => mounted(<ComponentWithDynamicContextUsageAndPropertyOutput label={O.atom("hello")}/>)).toThrow("setContext/onContext supported only for components that returns a static piece of DOM")
        })
        it("Throws when using context that's not set", () => {
            expect(() => mounted(<ContextUser label="hello"/>)).toThrow("Context value MEANING_OF_LIFE not set")
        })
    })

    const ComponentWithStaticContextUsage = () => {
        H.setContext(MEANING_OF_LIFE, 42)
        return <div id="parent">
            <ContextUser label="meaning"/>
        </div>
    }
    const ComponentWithDynamicContextUsage = ({ label }: { label: O.Property<string>}) => {
        H.setContext(MEANING_OF_LIFE, 42)
        return <div id="parent">
            { O.map(label, l => <ContextUser label={l}/>) }
        </div>
    }
    const ComponentWithDynamicContextUsageAndPropertyOutput = ({ label }: { label: O.Property<string>}) => {
        H.setContext(MEANING_OF_LIFE, 42)
        const result = O.atom(<div id="parent">
            { O.map(label, l => <ContextUser label={l}/>) }
        </div>)
        return result
    }
    const ContextUser = ({label}: {label: string}) => {
        const contextValue = O.atom<number>(0)
        H.onContext(MEANING_OF_LIFE, contextValue.set)
        return <label>{label}: {contextValue}</label>
    }
})
