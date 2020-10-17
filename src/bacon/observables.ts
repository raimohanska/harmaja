import * as O from "baconjs"
import * as A from "./atom"
import { getCurrentValue } from "./currentvalue"

// Re-export native observable types for external usage
export type NativeProperty<T> = O.Property<T>
export type NativeAtom<T> = O.Property<T>
export type NativeEventStream<T> = O.EventStream<T>
export type Scope = {}

// Local narrow interfaces used internally
export type Predicate<A> = (value: A) => boolean
export type Observable<T> = {}
export type Atom<T> = {}
export type Property<T> = {}
export type EventStream<T> = {}
export interface Bus<T> {
    push(value: T): void;
    end(): void;
}
export type Unsub = () => void

export function bus<T>(): Bus<T> {
    return new O.Bus()
}

export function get<A>(prop: Property<A>): A {
    return getCurrentValue(prop as O.Property<A>)
}

export function set<A>(atom: Atom<A>, value: A) {
    (atom as A.Atom<A>).set(value)
}

export function isProperty(x: any): x is Property<any> {
    return x instanceof O.Property
}
export function forEach<V>(x: Observable<V>, fn: (value: V) => void): Unsub {
    return (x as O.Observable<any>).forEach(fn)
}

export function view<A, K extends keyof A>(a: Atom<A>, key: number): Atom<A[K] | undefined>;
export function view<A, K extends keyof A>(a: Property<A>, key: number): Property<A[K] | undefined>;
export function view<A, K extends keyof A>(a: any, key: number): any {
    if (A.isAtom(a)) {
        return a.view(key as any)
    } else if (a instanceof O.Property) {
        return a.map(x => x[key])
    } else {
        throw Error("Unknown observable: " + a)
    }
}

export function filter<A>(a: Atom<A>, fn: Predicate<A>): Atom<A>;
export function filter<A>(a: Property<A>, fn: Predicate<A>): Property<A>;
export function filter<A>(a: any, fn: Predicate<A>): any {
    if (A.isAtom(a)) {
        return a.freezeUnless(fn as any)
    } else if (a instanceof O.Property) {
        return a.filter(fn)
    } else {
        throw Error("Unknown observable: " + a)
    }
}
