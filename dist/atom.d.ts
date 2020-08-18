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
export declare function atom<A>(initial: A): Atom<A>;
