import { Observer, PropertyEventType, Atom, Property } from "./abstractions";
import { StatefulPropertyBase, StatefulPropertySource } from "./property";
import { duplicateSkippingObserver } from "./util";
import * as L from "../lens"
import { Dispatcher } from "./dispatcher";
import { outOfScope, OutOfScope, Scope } from "./scope";

class RootAtom<V> extends Atom<V> {    
    private dispatcher = new Dispatcher<V, PropertyEventType>();
    private value: V

    constructor(initialValue: V) {
        super()
        this.value = initialValue        
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        if (event === "value") {
            observer(this.get())
        }
        return this.dispatcher.on(event, observer)
    }

    get(): V {
        return this.value
    }
    set(newValue: V): void {
        this.value = newValue;
        this.dispatcher.dispatch("value", newValue)
        this.dispatcher.dispatch("change", newValue)
    }
    modify(fn: (old: V) => V): void {
        this.set(fn(this.value))
    }
}

class LensedAtom<R, V> extends Atom<V> {
    private root: Atom<R>;
    private lens: L.Lens<R, V>;

    constructor(root: Atom<R>, view: L.Lens<R, V>) {
        super()
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
        return this.root.on("change", newRoot => {
            statefulObserver(this.lens.get(newRoot))
        })       
    }
}

class DependentAtom<V> extends Atom<V> {
    private input: Property<V>;
    private onChange: (updatedValue: V) => void;

    constructor(input: Property<V>, onChange: (updatedValue: V) => void) {
        super()
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
        return this.input.on(event, observer)    
    }
}

export class StatefulDependentAtom<V> extends Atom<V> {
    private dispatcher = new Dispatcher<V, PropertyEventType>();
    private onChange: (updatedValue: V) => void;
    private value: V | OutOfScope = outOfScope

    constructor(scope: Scope, source: StatefulPropertySource<V>, onChange: (updatedValue: V) => void) {
        super()
        this.onChange = onChange;
        const meAsObserver = (newValue: V) => {
            this.value = newValue
            this.dispatcher.dispatch("change", newValue)
            this.dispatcher.dispatch("value", newValue)
        }
        scope.on("in", () => {
            this.value = source(meAsObserver);
        })
        scope.on("out", () => {
            this.value = outOfScope;
        })
    }
    get(): V {
        if (this.value === outOfScope) throw Error("Atom out of scope");
        return this.value as V;
    }
    set(newValue: V) {
        this.onChange(newValue)
    }
    modify(fn: (old: V) => V) {
        this.set(fn(this.get()))
    }
    on(event: PropertyEventType, observer: Observer<V>) {
        if (event === "value") {
            observer(this.get())
        }
        return this.dispatcher.on(event, observer)
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
        return new RootAtom<A>(x)
    } else {
        return new DependentAtom(x, y)
    }
}

export function freezeUnless<A>(scope: Scope, atom: Atom<A>, freezeUnlessFn: (a: A) => boolean): Atom<A> {
    const onChange = (v: A) => atom.set(v)
    const source = (observer: Observer<A>) => {
        const initial = atom.get()
        if (!freezeUnlessFn(initial)) {
            throw Error("Cannot create frozen atom with initial value not passing the given filter function")
        }
        atom.on("change", newValue => {
            if (freezeUnlessFn(newValue)) {
                observer(newValue)
            }
        })
        return atom.get()
    }
    return new StatefulDependentAtom(scope, source, onChange)
}