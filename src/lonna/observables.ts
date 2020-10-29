import * as O from "lonna"

// Re-export native observable types for external usage
export type NativeProperty<T> = O.Property<T>
export type NativeAtom<T> = O.Atom<T>
export type NativeEventStream<T> = O.EventStream<T>
export type Lens<A, B> = O.Lens<A, B>
export type Scope = O.Scope

// Local narrow interfaces used internally
export type Predicate<A> = (value: A) => boolean
export type Observable<T> = {}
export type Atom<T> = {}
export type Property<T> = {}
export type EventStream<T> = {}
export interface Bus<T> extends NativeEventStream<T> {}
export type Unsub = () => void

export function pushAndEnd<T>(bus: Bus<T>, value: T) {
    const nativeBus = bus as O.Bus<T>
    nativeBus.push(value)
    nativeBus.end()
}

export function bus<T>(): Bus<T> {
    return O.bus()
}

export function get<A>(prop: Property<A>): A {
    return (prop as O.Property<A>).get()
}

export function set<A>(atom: Atom<A>, value: A) {
    (atom as O.Atom<A>).set(value)
}

export function isProperty(x: any): x is Property<any> {
    return x instanceof O.Property
}
export function forEach<V>(x: Observable<V>, fn: (value: V) => void): Unsub {
    return (x as O.Observable<any>).forEach(fn)
}

export function view<A, K extends keyof A>(a: Atom<A>, key: number): Atom<A[K] | undefined>;
export function view<A, K extends keyof A>(a: Property<A>, key: number): Property<A[K] | undefined>;
export function view<A, K extends keyof A>(a: Atom<A> | Property<A>, key: number): any {
    return O.view(a as any, key as any)
}

export function filter<A>(prop: Atom<A>, fn: Predicate<A>): Atom<A>;
export function filter<A>(prop: Property<A>, fn: Predicate<A>): Property<A>;
export function filter<A>(prop: Property<A> | Property<A>, fn: Predicate<A>): any {
    return O.filter(fn, O.autoScope)(prop as any)
}

export const observablesThrowError = true
export const observablesImplementationName = "Lonna"
