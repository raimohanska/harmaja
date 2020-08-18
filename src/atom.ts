import * as B from "baconjs"

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

export function atom<A>(initial: A): Atom<A> {
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
        
    return mkAtom<A>(theAtom, get, modify)
}

const valueMissing = {}

function mkAtom<A>(observable: B.Property<A>, get: () => A, modify: ( (fn: (a : A) => A) => Atom<A>)): Atom<A> {
    const theAtom: any = observable
    theAtom.set = (newValue: A) => {
        theAtom.modify(() => newValue)
        return theAtom
    }
    theAtom.modify = modify
    theAtom.subscribe(() => {})
    theAtom.get = get
    theAtom.freezeUnless = (freezeUnlessFn: (a: A) => boolean) => {
        let value: A | {} = valueMissing
        let frozenAtom: any = mkAtom(
            observable.filter((x : A) => freezeUnlessFn(x)).doAction((v: A) => { value = v }), 
            () => value as any,
            (fn: (a: A) => A) => { modify(fn); return frozenAtom}
        )
        if (value === valueMissing) {
            throw new Error("Initial value missing or matches freezing criteria, unable to construct Atom")
        }
        return frozenAtom
    }
    theAtom.view = (view: any) => {
        if (typeof view === "string") {
            const lens = {
                get: (root: A) => (root as any)[view],
                set: (root: A, newValue: any) => ({ ...root, [view]: newValue})
            }
            return lensedAtom(theAtom.freezeUnless((a : any) => a !== undefined), lens)
        }
        else if (typeof view === "number") {            
            const index = view
            const lens = {
                get: (root: A) => (root as any)[view],
                set: (nums: any, newValue: any) => newValue === undefined  
                    ? [...nums.slice(0, index), ...nums.slice(index+1)]
                    : [...nums.slice(0, index), newValue, ...nums.slice(index+1)]
            }
            return lensedAtom(theAtom.freezeUnless((a : any) => a !== undefined), lens)
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