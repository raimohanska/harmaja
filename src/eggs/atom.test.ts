import * as B from "./eggs"
import * as A from "./atom"
import { globalScope } from "./eggs"

describe("Atom", () => {
    describe("Basics", () => {
        it ("Uses inheritance", () => {
            expect(A.atom(1) instanceof B.Atom).toEqual(true)
            expect(A.atom(1) instanceof B.Property).toEqual(true)
            expect(A.atom(1) instanceof B.Observable).toEqual(true)
        })

        it ("Dispatches values", () => {
            const a = A.atom(1)
            let value: any = null
            a.forEach(v => value = v)
            expect(value).toEqual(1)
            a.set(2)
            expect(value).toEqual(2)
        })
    })
    describe("Array index lenses", () => {
        it("Views into existing and non-existing indices", () => {
            const a = A.atom([1,2,3])
            expect(A.view(a, 1).get()).toEqual(2)
    
            expect(A.view(a, 3).get()).toEqual(undefined)    
        })
        it("Supports removal by setting to undefined", () => {
            const a = A.atom([1,2,3])
            const view = A.view(a, 1)
    
            view.set(undefined)
            expect(a.get()).toEqual([1, 3])            
        })    
    })
    describe("Object key lenses", () => {
        it("Manipulates object properties", () => {
            const a = A.atom({foo: "bar"})
            const view = A.view(a, "foo")
            expect(view.get()).toEqual("bar")
        })    
    })

    describe("Freezing", () => {
        it("Can be frozen on unwanted values", () => {
            const a = B.filter(A.atom<string | null>("hello"), a => a !== null, globalScope)
            
            a.set("world")
            expect(a.get()).toEqual("world")
            a.set(null)
            expect(a.get()).toEqual("world")
        })
    
        it("Can be frozen on unwanted values (when not getting in between sets)", () => {
            const atom = B.filter(A.atom<string | null>("hello"), a => a !== null, globalScope)    
            
            atom.set("world")        
            atom.set(null)
            expect(atom.get()).toEqual("world") 
        })    
    })

})

describe("Dependent Atom", () => {
    it("Works", () => {
        var b = B.bus()
        var prop = B.toProperty(b, "1", globalScope)
        var atom = A.atom(prop, newValue => b.push(newValue))        
        expect(atom.get()).toEqual("1")
        atom.set("2")
        expect(atom.get()).toEqual("2")
    })

    describe("Freezing", () => {
        it("Can be frozen on unwanted values", () => {
            var b = B.bus()
            var prop = B.toProperty(b, "1", globalScope)
            const root = A.atom(prop, newValue => b.push(newValue))
            var atom = B.filter(root, a => a !== null, globalScope)
    
            atom.set("world")
            expect(atom.get()).toEqual("world")
            atom.set(null)
            expect(atom.get()).toEqual("world")
        })
    
        it("Can be frozen on unwanted values (subscriber case)", () => {
            var b = B.bus()
            var prop = B.toProperty(b, "1", globalScope)
            const root = A.atom(prop, newValue => b.push(newValue))
            var atom = B.filter(root, a => a !== null, globalScope)
    
            atom.set("world")        
            atom.set(null)
            expect(atom.get()).toEqual("world")        
        })     
    })
})