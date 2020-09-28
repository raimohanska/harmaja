import * as B from "baconjs"
import * as L from "./lens"
import { getCurrentValue } from "./utilities"

export interface Atom<A> extends B.Property<A> {
    set(newValue: A): this;
    get(): A
    modify(fn: (a: A) => A): this;
    view<K extends keyof A>(key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>,
    view<B>(lens: L.Lens<A, B>): Atom<B>,
    // TODO: Freezing is a bit hacky. Would be nicer if there was another way
    // to prevent crashing when an element is removed and should no longer be rendered
    freezeUnless<E extends A>(fn: (a: A) => a is E): Atom<E>
    freezeUnless(fn: (a: A) => boolean): Atom<A>
    case<S1 extends A, O>(match1: BranchMatch<A, S1>, map1: BranchMap<A, S1, O>): O
    case<S1 extends A, S2 extends A, O>(match1: BranchMatch<A, S1>, map1: BranchMap<A, S1, O>, match2: BranchMatch<A, S2>, map2: BranchMap<A, S2, O>): O
    case<S1 extends A, S2 extends A, S3 extends A, O>(match1: BranchMatch<A, S1>, map1: BranchMap<A, S1, O>, match2: BranchMatch<A, S2>, map2: BranchMap<A, S2, O>, match3: BranchMatch<A, S3>, map3: BranchMap<A, S3, O>): O
    case<S1 extends A, S2 extends A, S3 extends A, S4 extends A, O>(match1: BranchMatch<A, S1>, map1: BranchMap<A, S1, O>, match2: BranchMatch<A, S2>, map2: BranchMap<A, S2, O>, match3: BranchMatch<A, S3>, map3: BranchMap<A, S3, O>, match4: BranchMatch<A, S4>, map4: BranchMap<A, S4, O>): O
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
 * Note: unlike an independent atom, the dependent atom is lazy. This means that it will keep its
 * value up-to-date only if there is a subscriber to it or the underlying property.
 * 
 * @param input      Property to reflect
 * @param onChange   Function to be called when `atom.set` is called
 */
export function atom<A>(input: B.Property<A>, onChange: (updatedValue: A) => void): Atom<A>

export function atom<A>(x: any, y?: any): Atom<A> {
    if (arguments.length == 1) {
        // Create an independent Atom
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

        const set = (a: A) => {
            bus.push(() => a)
            return theAtom
        }

        theAtom.subscribe(() => {})
            
        return mkAtom<A>(theAtom, get, modify, set)
    } else {
        // Create a dependent Atom
        const property = x as B.Property<A>
        const onChange: (updatedValue: A) => void = y
        const theAtom = property.map(x => x).skipDuplicates((a, b) => a === b)
        const get = () => getCurrentValue(property)
        const set = (newValue: A) => {
            onChange(newValue)
            return theAtom as Atom<A>
        }
        const modify = (f: (a: A) => A) => {
            set(f(get()))
            return theAtom as Atom<A>
        }        
        return mkAtom(theAtom, get, modify, set) 
    }
}

export function isAtom<A>(x: any): x is Atom<A> {
    return !!((x instanceof B.Property) && (x as any).get && ((x as any).freezeUnless))
}

type BranchMatch<A, S extends A> = (value: A) => value is S
type BranchMap<A, S extends A, O> = (atom: Atom<S>) => O

// Note: actually mutates the given observable into an Atom!
function mkAtom<A>(observable: B.Property<A>, get: () => A, modify: ( (fn: (a : A) => A) => Atom<A>), set: (a: A) => Atom<A>): Atom<A> {
    const theAtom = observable as Atom<A>
    theAtom.set = set
    theAtom.modify = modify    
    theAtom.get = get
    theAtom.freezeUnless = (freezeUnlessFn: (a: A) => boolean) => {
        let previousValue = getCurrentValue(observable)
        if (!freezeUnlessFn(previousValue)) {
            throw Error("Cannot create frozen atom with initial value not passing the given filter function")
        }
        let freezingProperty = theAtom.filter(freezeUnlessFn).doAction(v => {previousValue = v})
        let onChange = (newValue: A) => theAtom.set(newValue)
        let fa = atom(freezingProperty, onChange)
        fa.get = () => {
            let wouldBeValue = getCurrentValue(observable)
            if (freezeUnlessFn(wouldBeValue)) {
                previousValue = wouldBeValue
            }
            return previousValue
        }
        return fa
    }
    theAtom.view = (view: any): any => {
        if (typeof view === "string") {
            return lensedAtom(theAtom, L.prop<A, any>(view))
        }
        else if (typeof view === "number") {                        
            return lensedAtom(theAtom, L.item(view as number) as any)
        } else {
            const lens = view
            return lensedAtom(theAtom, lens)
        }        
    }
    theAtom.case = (...fns: any) => {
        const matchingBranch = (value: A) => {
            let i = 0
            while (i < fns.length) {
                const match = fns[i++]
                const map = fns[i++]
                if (match(value)) return { i, match, map }
            }
            throw new Error(`No branch matched value ${value}`)
        }

        return theAtom.skipDuplicates((left, right) => {
            return matchingBranch(left).i === matchingBranch(right).i
        }).flatMapLatest(value => {
            const { match, map } = matchingBranch(value)
            return map(theAtom.freezeUnless(match))
        })
    }
    return theAtom
}

function lensedAtom<A, B>(root: Atom<A>, lens: L.Lens<A, B>): Atom<B> {
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
    const set = (b: B) => {
        const currentRootValue = root.get()
        const newRootValue = lens.set(currentRootValue, b)
        root.set(newRootValue)
        return theAtom
    }
    return mkAtom(theAtom, get, modify, set)
}
