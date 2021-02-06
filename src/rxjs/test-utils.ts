import * as Rx from "rxjs"
import * as A from "./atom"
import * as RxOps from "rxjs/operators"
import { unmount, HarmajaOutput, HarmajaStaticOutput } from "../harmaja"

export function testRender<T>(
    init: T,
    test: (property: Rx.Observable<T>, set: (v: T) => any) => HarmajaOutput
) {
    const subject = new Rx.BehaviorSubject<T>(init)
    const element = test(subject, (value) => subject.next(value))
    unmount(element as HarmajaStaticOutput)
    // Verify that all subscribers are removed on unmount
    expect(subject.observers.length).toEqual(0)
}
export type Property<T> = Rx.Observable<T>
export type Atom<T> = Rx.Observable<T>
export type EventStream<T> = Rx.Observable<T>

export const atom = A.atom
export function constant<A>(value: A) {
    return new Rx.BehaviorSubject(value)
}
export function map<A, B>(
    observable: Rx.Observable<A>,
    fn: (a: A) => B
): Rx.Observable<B> {
    return observable.pipe(RxOps.map(fn))
}
