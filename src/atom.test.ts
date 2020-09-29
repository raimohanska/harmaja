import * as B from "baconjs"
import * as A from "./atom"
import { getCurrentValue } from "./utilities"

describe("Atom", () => {
    describe("Array index lenses", () => {
        it("Views into existing and non-existing indices", () => {
            const a = A.atom([1,2,3])
            expect(a.view(1).get()).toEqual(2)
    
            expect(a.view(3).get()).toEqual(undefined)    
        })
        it("Passes sanity checks", () => {
            const a = A.atom([1,2,3])
            const view = a.view(1)
    
            expect(view.set(2)).toEqual(view)
            expect(A.isAtom(view)).toEqual(true)
        })    
        it("Supports removal by setting to undefined", () => {
            const a = A.atom([1,2,3])
            const view = a.view(1)
    
            view.set(undefined)
            expect(a.get()).toEqual([1, 3])            
        })    
    })
    describe("Object key lenses", () => {
        it("Passes sanity checks", () => {
            const a = A.atom({foo: "bar"})
            const view = a.view("foo")
            expect(view.set("qwer")).toEqual(view)
            expect(A.isAtom(view)).toEqual(true)
        })    
        it("Manipulates object properties", () => {
            const a = A.atom({foo: "bar"})
            const view = a.view("foo")
            expect(view.get()).toEqual("bar")
        })    
    })

    describe("Freezing", () => {
        it("Can be frozen on unwanted values", () => {
            const a = A.atom<string | null>("hello").freezeUnless(a => a !== null)
            
            a.set("world")
            expect(a.get()).toEqual("world")
            a.set(null)
            expect(a.get()).toEqual("world")
            
            expect(a.set("hello")).toEqual(a)
        })
    
        it("Can be frozen on unwanted values (when not getting in between sets)", () => {
            const atom = A.atom<string | null>("hello").freezeUnless(a => a !== null)    
            atom.subscribe() // TODO: currently needs this. Should not!
            atom.set("world")        
            atom.set(null)
            expect(atom.get()).toEqual("world")        

            expect(atom.set("hello")).toEqual(atom)
        })    
    })

})

describe("Dependent Atom", () => {
    it("Works", () => {
        var b = new B.Bus()
        var prop = b.toProperty("1")
        var atom = A.atom(prop, newValue => b.push(newValue))
        prop.subscribe() // Dependent atoms need a subscription to remain up-to-date
        expect(atom.get()).toEqual("1")
        atom.set("2")
        expect(atom.get()).toEqual("2")
        expect(A.isAtom(atom)).toEqual(true)
    })

    describe("Freezing", () => {
        it("Can be frozen on unwanted values", () => {
            var b = new B.Bus()
            var prop = b.toProperty("1")
            var atom = A.atom(prop, newValue => b.push(newValue)).freezeUnless(a => a !== null)
            prop.subscribe() // Dependent atoms need a subscription to remain up-to-date
    
            atom.set("world")
            expect(atom.get()).toEqual("world")
            atom.set(null)
            expect(atom.get()).toEqual("world")
        })
    
        it("Can be frozen on unwanted values (subscriber case)", () => {
            var b = new B.Bus()
            var prop = b.toProperty("1")
            var atom = A.atom(prop, newValue => b.push(newValue)).freezeUnless(a => a !== null)
            prop.subscribe() // Dependent atoms need a subscription to remain up-to-date
            atom.subscribe()
    
            atom.set("world")        
            atom.set(null)
            expect(atom.get()).toEqual("world")        
        })    

        it("Complex case", () => {        
            const a = A.atom<string | null>("hello");
            
            const mapped = a.skipDuplicates(x => typeof x === "string").flatMapLatest((s) => {
                if (typeof s === "string") {
                    return (a.freezeUnless((x) => !!x) as A.Atom<string>).view("length");
                } else {
                    return a.freezeUnless((x) => !x).map(x => 0);
                }              
            });
            
            expect(getCurrentValue(mapped)).toEqual(5)
            a.set(null)
            expect(getCurrentValue(mapped)).toEqual(0)
            a.set("boom")
            expect(getCurrentValue(mapped)).toEqual(4)
        })        
    })

    it("Recognizes non-atoms", () => {
        expect(A.isAtom(new B.Bus())).toEqual(false)
        expect(A.isAtom(B.constant(true))).toEqual(false)
    })
})