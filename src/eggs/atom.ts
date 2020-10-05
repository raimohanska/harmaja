import { Observer, PropertyEventType, Atom, Property, PropertyEvents, Unsub } from "./abstractions";
import { StatefulPropertyBase, StatefulPropertySource } from "./property";
import { duplicateSkippingObserver } from "./util";
import * as L from "../lens"
import { Dispatcher } from "./dispatcher";
import { afterScope, beforeScope, checkScope, globalScope, OutOfScope, Scope } from "./scope";

class RootAtom<V> extends Atom<V> {    
    private dispatcher = new Dispatcher<PropertyEvents<V>>();
    private value: V

    constructor(desc: string, initialValue: V) {
        super(desc)
        this.value = initialValue        
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        const unsub = this.dispatcher.on(event, observer)
        if (event === "value") {
            observer(this.get())
        }
        return unsub
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
    scope() {
        return globalScope
    }
}

class LensedAtom<R, V> extends Atom<V> {
    private root: Atom<R>;
    private lens: L.Lens<R, V>;

    constructor(desc: string, root: Atom<R>, view: L.Lens<R, V>) {
        super(desc)
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
        const unsub = this.root.on("change", newRoot => {
            statefulObserver(this.lens.get(newRoot))
        })     
        let initial = this.get()
        const statefulObserver = duplicateSkippingObserver(initial, observer)
        
        if (event === "value") {
            observer(initial)
        }
        return unsub  
    }

    scope() {
        return this.root.scope()
    }
}

class DependentAtom<V> extends Atom<V> {
    private input: Property<V>;
    private onChange: (updatedValue: V) => void;

    constructor(desc: string, input: Property<V>, onChange: (updatedValue: V) => void) {
        super(desc)
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

    scope() {
        return this.input.scope()
    }
}

export class StatefulDependentAtom<V> extends Atom<V> {
    private _scope: Scope
    private dispatcher = new Dispatcher<PropertyEvents<V>>();
    private onChange: (updatedValue: V) => void;
    private value: V | OutOfScope = beforeScope

    constructor(desc: string, scope: Scope, source: StatefulPropertySource<V>, onChange: (updatedValue: V) => void) {
        super(desc)
        this._scope = scope;
        this.onChange = onChange;
        let unsub: Unsub | null = null
        const meAsObserver = (newValue: V) => {
            this.value = newValue
            this.dispatcher.dispatch("change", newValue)
            this.dispatcher.dispatch("value", newValue)
        }
        scope(
            () => [this.value, unsub] = source(meAsObserver), 
            () => { this.value = afterScope; unsub!() }, 
            this.dispatcher
        )
    }
    get(): V {
        return checkScope(this, this.value)
    }
    set(newValue: V) {
        this.onChange(newValue)
    }
    modify(fn: (old: V) => V) {
        this.set(fn(this.get()))
    }
    on(event: PropertyEventType, observer: Observer<V>) {
        const unsub = this.dispatcher.on(event, observer)
        if (event === "value") {
            observer(this.get())
        }
        return unsub
    }    
    scope() {
        return this._scope
    }

}

export function view<A, K extends keyof A>(a: Atom<A>, key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>;
export function view<A, B>(a: Atom<A>, lens: L.Lens<A, B>): Atom<B>;
export function view<A, B>(atom: Atom<A>, view: any): Atom<B> {
    if (typeof view === "string") {
        return new LensedAtom<A, B>(atom + "." + view, atom, L.prop<any, any>(view))
    }
    else if (typeof view === "number") {                        
        return new LensedAtom(atom + `[${view}]`, atom, L.item(view as number) as any)
    } else {
        return new LensedAtom(atom + ".view(..)", atom, view)
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
        return new RootAtom<A>("RootAtom", x)
    } else {
        return new DependentAtom(`DependentAtom(${x})`, x, y)
    }
}

export function freezeUnless<A>(scope: Scope, atom: Atom<A>, freezeUnlessFn: (a: A) => boolean): Atom<A> {
    const onChange = (v: A) => atom.set(v)
    const source = (observer: Observer<A>) => {
        const initial = atom.get()
        if (!freezeUnlessFn(initial)) {
            throw Error("Cannot create frozen atom with initial value not passing the given filter function")
        }
        const unsub = atom.on("change", newValue => {
            if (freezeUnlessFn(newValue)) {
                observer(newValue)
            }
        })
        return [atom.get(), unsub] as any
    }
    return new StatefulDependentAtom(atom + ".freezeUnless(fn)", scope, source, onChange)
}