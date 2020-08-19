import * as B from "baconjs"
import { getCurrentValue } from "./harmaja";

export interface Lens<A, B> {
    get(root: A): B
    set(root: A, newValue: B): A
}

export interface Atom<A> extends B.Property<A> {
    set(newValue: A): this;
    get(): A
    modify(fn: (a: A) => A): this;
    view<K extends keyof A>(key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>,
    view<B>(lens: Lens<A, B>): Atom<B>,
    // TODO: Freezing is a bit hacky. Would be nicer if there was another way
    // to prevent crashing when an element is removed and should no longer be rendered
    freezeUnless<E extends A>(fn: (a: A) => a is E): Atom<E>
    freezeUnless(fn: (a: A) => boolean): Atom<A>
}

/**
 * Create an independent atom, with given initial atom
 * 
 * @param initial 
 */
export function atom<A>(initial: A): Atom<A>

/**
 * Create a dependent atom that reflects the value of the given Property. The `onChange` function
 * is supposed to eventually cause the `input` property to be updated to the new value.
 * 
 * This constructor provides a bridge between atom-based components and "unidirectional data flow"
 * style state management.
 * 
 * @param input      Property to reflect
 * @param onChange   Function to be called when `atom.set` is called
 */
export function atom<A>(input: B.Property<A>, onChange: (updatedValue: A) => void): Atom<A>

export function atom<A>(x: any, y?: any): Atom<A> {
    if (arguments.length == 1) {
        const initial = x as A
        const bus = new B.Bus<(a: A) => A>()
        const theAtom: any = bus.scan(initial, (v, fn) => { 
            const newValue = fn(v);
            (theAtom as any).value = newValue;
            return newValue
        }).skipDuplicates((a, b) => a === b)
    
        theAtom.value = initial
        
        const get = () => theAtom.value
    
        const modify = (f: (a: A) => A) => {
            bus.push(f)
            return theAtom
        }

        theAtom.subscribe(() => {})
            
        return mkAtom<A>(theAtom, get, modify)
    } else {
        const property = x as B.Property<A>
        const onChange: (updatedValue: A) => void = y
        const theAtom = property.map(x => x).skipDuplicates((a, b) => a === b)
        const get = () => getCurrentValue(theAtom)
        const set = (newValue: A) => {
            onChange(newValue)
            return theAtom as Atom<A>
        }
        const modify = (f: (a: A) => A) => {
            set(f(get()))
            return theAtom as Atom<A>
        }
        return mkAtom(property, get, modify, set) 
    }
}

const valueMissing = {}

function mkAtom<A>(observable: B.Property<A>, get: () => A, modify: ( (fn: (a : A) => A) => Atom<A>), set?: (a: A) => Atom<A>): Atom<A> {
    const theAtom: any = observable
    theAtom.set = (newValue: A) => {
        theAtom.modify(() => newValue)
        return theAtom
    }
    theAtom.modify = modify    
    theAtom.get = get
    theAtom.freezeUnless = (freezeUnlessFn: (a: A) => boolean) => {
        return atom(theAtom.filter(freezeUnlessFn), newValue => theAtom.set(newValue))
    }
    theAtom.view = (view: any) => {
        if (typeof view === "string") {
            const lens = {
                get: (root: A) => (root as any)[view],
                set: (root: A, newValue: any) => ({ ...root, [view]: newValue})
            }
            return lensedAtom(theAtom, lens)
        }
        else if (typeof view === "number") {            
            const index = view
            const lens = {
                get: (root: A) => (root as any)[view],
                set: (nums: any, newValue: any) => newValue === undefined  
                    ? [...nums.slice(0, index), ...nums.slice(index+1)]
                    : [...nums.slice(0, index), newValue, ...nums.slice(index+1)]
            }
            return lensedAtom(theAtom, lens)
        } else {
            const lens = view
            return lensedAtom(theAtom, lens)
        }        
    }
    return theAtom
}

function lensedAtom<A, B>(root: Atom<A>, lens: Lens<A, B>): Atom<B> {
    const theAtom = root.map(value => lens.get(value)) as any
    const get = () => lens.get(root.get())
    const modify = (fn: (b: B) => B) => {
        root.modify((currentRootValue: A) => {
            const currentChildValue = lens.get(currentRootValue)
            const newChildValue = fn(currentChildValue)
            const newRootValue = lens.set(currentRootValue, newChildValue)
            return newRootValue
        })
        return theAtom
    }
    return mkAtom(theAtom, get, modify)
}