import { Observer, PropertyEventType, Atom, Property } from "./abstractions";
import { StatefulPropertyBase } from "./property";
import { duplicateSkippingObserver } from "./util";
import * as L from "../lens"

class RootAtom<V> extends StatefulPropertyBase<V> implements Atom<V> {    
    private value: V

    constructor(initialValue: V) {
        super()
        this.value = initialValue        
    }

    get(): V {
        return this.value
    }
    set(newValue: V): void {
        this.value = newValue;
        this.dispatcher.dispatch("change", newValue)
    }
    modify(fn: (old: V) => V): void {
        this.set(fn(this.value))
    }
}

class LensedAtom<R, V> implements Atom<V> {
    private root: Atom<R>;
    private lens: L.Lens<R, V>;

    constructor(root: Atom<R>, view: L.Lens<R, V>) {
        this.root = root;
        this.lens = view;
    }

    get() {
        return this.lens.get(this.root.get())
    }

    set(newValue: V) {
        this.root.set(this.lens.set(this.root.get(), newValue))
    }

    modify(fn: (old: V) => V) {
        this.root.modify(oldRoot => this.lens.set(oldRoot, fn(this.lens.get(oldRoot))))
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        let initial = this.get()
        const statefulObserver = duplicateSkippingObserver(initial, observer)
        
        if (event === "value") {
            observer(initial)
        }
        this.root.on("change", newRoot => {
            statefulObserver(this.lens.get(newRoot))
        })       
    }
}

class DependentAtom<V> implements Atom<V> {
    private input: Property<V>;
    private onChange: (updatedValue: V) => void;

    constructor(input: Property<V>, onChange: (updatedValue: V) => void) {
        this.input = input;
        this.onChange = onChange;
    }

    get() {
        return this.input.get()
    }

    set(newValue: V) {
        this.onChange(newValue)
    }

    modify(fn: (old: V) => V) {
        this.set(fn(this.get()))
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        this.input.on(event, observer)    
    }
}

export function view<A, K extends keyof A>(a: Atom<A>, key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>;
export function view<A, B>(a: Atom<A>, lens: L.Lens<A, B>): Atom<B>;
export function view<A, B>(atom: Atom<A>, view: any): Atom<B> {
    if (typeof view === "string") {
        return new LensedAtom<A, B>(atom, L.prop<any, any>(view))
    }
    else if (typeof view === "number") {                        
        return new LensedAtom(atom, L.item(view as number) as any)
    } else {
        return new LensedAtom(atom, view)
    }   
}
export function atom<A>(initial: A): Atom<A>;
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
export function atom<A>(input: Property<A>, onChange: (updatedValue: A) => void): Atom<A>;

export function atom<A>(x: any, y?: any): Atom<A> {
    if (arguments.length == 1) {
        // Create an independent Atom
        return new RootAtom<A>(x)
    } else {
        throw new DependentAtom(x, y)
    }
}

