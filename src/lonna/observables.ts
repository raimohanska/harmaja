import * as O from 'lonna'

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
  ;(atom as O.Atom<A>).set(value)
}

export function isProperty(x: any): x is Property<any> {
  return O.isProperty(x)
}
export function forEach<V>(x: Observable<V>, fn: (value: V) => void): Unsub {
  return (x as O.Observable<any>).forEach(fn)
}

export const createScope = O.createScope
export const mkScope = O.mkScope

export function view<A, K extends keyof A>(
  a: Atom<A>,
  key: number
): Atom<A[K] | undefined>
export function view<A, K extends keyof A>(
  a: Property<A>,
  key: number
): Property<A[K] | undefined>
export function view<A, B>(a: Property<A>, fn: (a: A) => B): Property<B>
export function view<A, K extends keyof A>(a: any, key: any): any {
  return O.view(a, key)
}

export function filter<A>(
  prop: Atom<A>,
  fn: Predicate<A>,
  scope: Scope
): Atom<A>
export function filter<A>(
  prop: Property<A>,
  fn: Predicate<A>,
  scope: Scope
): Property<A>
export function filter<A>(
  prop: Property<A> | Property<A>,
  fn: Predicate<A>,
  scope: Scope
): any {
  return O.filter(fn, scope)(prop as any)
}

export const observablesImplementationName: string = 'Lonna'
