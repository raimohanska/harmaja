import * as O from 'baconjs'
import * as A from './atom'
import * as L from './lens'
import { getCurrentValue } from './currentvalue'
import { endEvent } from 'baconjs/types/event'

// Re-export native observable types for external usage
export type NativeProperty<T> = O.Property<T>
export type NativeAtom<T> = A.Atom<T>
export type NativeEventStream<T> = O.EventStream<T>
export type Lens<A, B> = L.Lens<A, B>
export type Scope = {
  start(): void
  end(): void
}
const mockScope = {
  start() {},
  end() {},
}
export function createScope() {
  return mockScope
}

export function mkScope(scopeFn: Function) {
  return mockScope
}
// Local narrow interfaces used internally
export type Predicate<A> = (value: A) => boolean
export type Observable<T> = {}
export type Atom<T> = {}
export type Property<T> = {}
export type EventStream<T> = {}
export interface Bus<T> extends NativeEventStream<T> {}
export type Unsub = () => void

export function bus<T>(): Bus<T> {
  return new O.Bus()
}

export function pushAndEnd<T>(bus: Bus<T>, value: T) {
  const nativeBus = bus as O.Bus<T>
  nativeBus.push(value)
  nativeBus.end()
}

export function get<A>(prop: Property<A>): A {
  return getCurrentValue(prop as O.Property<A>)
}

export function set<A>(atom: Atom<A>, value: A) {
  ;(atom as A.Atom<A>).set(value)
}

export function isProperty(x: any): x is Property<any> {
  return x instanceof O.Property
}
export function forEach<V>(x: Observable<V>, fn: (value: V) => void): Unsub {
  return (x as O.Observable<any>).forEach(fn)
}

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
  if (typeof key === 'function') {
    return a.map(key).skipDuplicates()
  } else if (A.isAtom(a)) {
    return a.view(key as any)
  } else if (a instanceof O.Property) {
    if (L.isLens(key)) {
      return a.map(key.get).skipDuplicates()
    }
    return a.map((x) => x[key]).skipDuplicates()
  } else {
    throw Error('Unknown observable: ' + a)
  }
}

export function filter<A>(a: Atom<A>, fn: Predicate<A>, scope: Scope): Atom<A>
export function filter<A>(
  a: Property<A>,
  fn: Predicate<A>,
  scope: Scope
): Property<A>
export function filter<A>(a: any, fn: Predicate<A>, scope: Scope): any {
  if (A.isAtom(a)) {
    return a.freezeUnless(fn as any)
  } else if (a instanceof O.Property) {
    return a.filter(fn)
  } else {
    throw Error('Unknown observable: ' + a)
  }
}

export const observablesImplementationName: string = 'Bacon.js'
