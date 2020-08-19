import * as B from "baconjs";
export interface Lens<A, B> {
    get(root: A): B;
    set(root: A, newValue: B): A;
}
export interface Atom<A> extends B.Property<A> {
    set(newValue: A): this;
    get(): A;
    modify(fn: (a: A) => A): this;
    view<K extends keyof A>(key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>;
    view<B>(lens: Lens<A, B>): Atom<B>;
    freezeUnless<E extends A>(fn: (a: A) => a is E): Atom<E>;
    freezeUnless(fn: (a: A) => boolean): Atom<A>;
}
/**
 * Create an independent atom, with given initial atom
 *
 * @param initial
 */
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
export declare function atom<A>(input: B.Property<A>, onChange: (updatedValue: A) => void): Atom<A>;
