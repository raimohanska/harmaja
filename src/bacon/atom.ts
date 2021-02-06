import * as B from "baconjs"
import * as L from "./lens"
import { getCurrentValue } from "./currentvalue"

export interface Atom<A> extends B.Property<A> {
    set(newValue: A): this
    get(): A
    modify(fn: (a: A) => A): this
    view<K extends keyof A>(
        key: K
    ): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>
    view<B>(lens: L.Lens<A, B>): Atom<B>
    // freezeUnless is like `filter` for Atoms. Using different name because extending Property which already has an incompatible `filter` method.
    freezeUnless<E extends A>(fn: (a: A) => a is E): Atom<E>
    freezeUnless(fn: (a: A) => boolean): Atom<A>
    eager: boolean
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
export function atom<A>(
    input: B.Property<A>,
    onChange: (updatedValue: A) => void
): Atom<A>

export function atom<A>(x: any, y?: any): Atom<A> {
    if (arguments.length == 1) {
        // Create an independent Atom
        const initial = x as A
        const bus = new B.Bus<(a: A) => A>()
        const theAtom: any = bus
            .scan(initial, (v, fn) => {
                const newValue = fn(v)
                ;(theAtom as any).value = newValue
                return newValue
            })
            .skipDuplicates((a, b) => a === b)

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

        return mkAtom<A>(theAtom, get, modify, set, true)
    } else {
        // Create a dependent Atom
        const property = x as B.Property<A>
        const eager = (property as any).eager
        const onChange: (updatedValue: A) => void = y
        const theAtom = property.map((x) => x).skipDuplicates((a, b) => a === b)
        const get = () => getCurrentValue(property)
        const set = (newValue: A) => {
            onChange(newValue)
            return theAtom as Atom<A>
        }
        const modify = (f: (a: A) => A) => {
            set(f(get()))
            return theAtom as Atom<A>
        }
        return mkAtom(theAtom, get, modify, set, eager)
    }
}

export function isAtom<A>(x: any): x is Atom<A> {
    return !!(
        x instanceof B.Property &&
        (x as any).get &&
        (x as any).freezeUnless
    )
}

// Note: actually mutates the given observable into an Atom!
function mkAtom<A>(
    observable: B.Property<A>,
    get: () => A,
    modify: (fn: (a: A) => A) => Atom<A>,
    set: (a: A) => Atom<A>,
    eager: boolean
): Atom<A> {
    const theAtom = observable as Atom<A>
    theAtom.set = set
    theAtom.modify = modify
    theAtom.get = get
    theAtom.freezeUnless = (freezeUnlessFn: (a: A) => boolean) => {
        let previousValue = getCurrentValue(observable)
        if (!freezeUnlessFn(previousValue)) {
            throw Error(
                "Cannot create frozen atom with initial value not passing the given filter function"
            )
        }
        let freezingProperty = theAtom.filter(freezeUnlessFn).doAction((v) => {
            previousValue = v
        })
        freezingProperty.eager = true
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
        } else if (typeof view === "number") {
            return lensedAtom(theAtom, L.item(view as number) as any)
        } else {
            const lens = view
            return lensedAtom(theAtom, lens)
        }
    }
    theAtom.eager = eager
    if (eager) theAtom.subscribe(() => {})
    return theAtom
}

function lensedAtom<A, B>(root: Atom<A>, lens: L.Lens<A, B>): Atom<B> {
    const theAtom = root.map((value) => lens.get(value)).skipDuplicates() as any
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
    return mkAtom(theAtom, get, modify, set, root.eager)
}
