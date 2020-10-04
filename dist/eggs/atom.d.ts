import { Observer, PropertyEventType, Atom, Property } from "./abstractions";
import { StatefulPropertySource } from "./property";
import * as L from "../lens";
import { Scope } from "./scope";
export declare class StatefulDependentAtom<V> extends Atom<V> {
    private dispatcher;
    private onChange;
    private value;
    constructor(desc: string, scope: Scope, source: StatefulPropertySource<V>, onChange: (updatedValue: V) => void);
    get(): V;
    set(newValue: V): void;
    modify(fn: (old: V) => V): void;
    on(event: PropertyEventType, observer: Observer<V>): import("..").Callback;
}
export declare function view<A, K extends keyof A>(a: Atom<A>, key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>;
export declare function view<A, B>(a: Atom<A>, lens: L.Lens<A, B>): Atom<B>;
export declare function atom<A>(initial: A): Atom<A>;
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
export declare function atom<A>(input: Property<A>, onChange: (updatedValue: A) => void): Atom<A>;
export declare function freezeUnless<A>(scope: Scope, atom: Atom<A>, freezeUnlessFn: (a: A) => boolean): Atom<A>;
