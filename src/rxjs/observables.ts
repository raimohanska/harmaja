import * as Rx from "rxjs"
import * as RxOps from "rxjs/operators"
import * as A from "./atom"
import * as L from "./lens"

// Re-export native observable types for external usage
export type NativeProperty<T> = Rx.Observable<T>
export type NativeAtom<T> = A.Atom<T>
export type NativeEventStream<T> = Rx.Observable<T>
export type Lens<A, B> = L.Lens<A, B>
export type Scope = {}

// Local narrow interfaces used internally
export type Predicate<A> = (value: A) => boolean
export type Observable<T> = {}
export type Atom<T> = {}
export type Property<T> = {}
export type EventStream<T> = {}
export interface Bus<T> extends NativeEventStream<T> {}
export type Unsub = () => void

export function bus<T>(): Bus<T> {
    return new Rx.Subject<T>();
}

export function pushAndEnd<T>(bus: Bus<T>, value: T) {
    const subject = bus as Rx.Subject<T>;
    subject.next(value);
    subject.complete();
}


export function get<A>(prop: Property<A>): A {
    return getCurrentValue(prop as Rx.Observable<A>)
}

export function set<A>(atom: Atom<A>, value: A) {
    (atom as A.Atom<A>).set(value)
}

export function isProperty(x: any): x is Property<any> {
    return !!(x && x.subscribe && x.forEach)
}
export function forEach<V>(x: Observable<V>, fn: (value: V) => void): Unsub {
    return _forEach(x as Rx.Observable<V>, fn)
}

export function view<A, K extends keyof A>(a: Atom<A>, key: number): Atom<A[K] | undefined>;
export function view<A, K extends keyof A>(a: Property<A>, key: number): Property<A[K] | undefined>;
export function view<A, K extends keyof A>(a: any, key: any): any {
    if (A.isAtom(a)) {
        return a.view(key as any)
    } else if (isProperty(a)) {
        const obs = (a as Rx.Observable<A>)
        if (L.isLens(key)) {
            return obs.pipe(RxOps.map(key.get))
        }
        return obs.pipe(RxOps.map(x => x[key]))
    } else {
        throw Error("Unknown observable: " + a)
    }
}

export function filter<A>(a: Atom<A>, fn: Predicate<A>): Atom<A>;
export function filter<A>(a: Property<A>, fn: Predicate<A>): Property<A>;
export function filter<A>(a: any, fn: Predicate<A>): any {
    if (A.isAtom(a)) {
        return a.freezeUnless(fn as any)
    } else if (isProperty(a)) {
        return (a as Rx.Observable<A>).pipe(RxOps.filter(fn))
    } else {
        throw Error("Unknown observable: " + a)
    }
}

export const valueMissing = {}
export type ValueMissing = typeof valueMissing

export function _forEach<V>(x: Rx.Observable<V>, fn: (value: V) => void): Unsub {
    const subscription = x.pipe(
        RxOps.tap(value => {
            fn(value)
        })
    ).subscribe(
        () => {}, 
        error => { 
            console.error("Caught error event", error)
            throw new Error(`Got error from observable ${x}: ${error}. Harmaja does not handle errors.`) 
        }, 
        () => {}
    )
    return () => subscription.unsubscribe()
}

export function getCurrentValue<A>(observable: Rx.Observable<A>): A {
  let currentV: any = valueMissing;
  if ((observable as any).get) {
    currentV = (observable as any).get(); // For Atoms
  } else {   
    _forEach(observable.pipe(RxOps.take(1)), v => currentV = v)
  }
  if (currentV === valueMissing) {
      console.log("Current value not found!", observable);
      throw new Error("Current value missing. Cannot render. " + observable);
  }      
  return currentV;
};

export const observablesThrowError = false
export const observablesImplementationName = "RxJs"
