import * as B from "baconjs"
import * as A from "./atom"
import { unmount, HarmajaOutput, HarmajaStaticOutput } from "../harmaja"

export function testRender<T>(
    init: T,
    test: (property: B.Property<T>, set: (v: T) => any) => HarmajaOutput
) {
    const bus = new B.Bus<T>()
    const property = bus.toProperty(init)
    const element = test(property, bus.push)
    unmount(element as HarmajaStaticOutput)
    // Verify that all subscribers are removed on unmount
    expect((property as any).dispatcher.subscriptions.length).toEqual(0)
}
export type Property<T> = B.Property<T>
export type Atom<T> = B.Property<T>
export type EventStream<T> = B.EventStream<T>
export function map<A, B>(
    observable: B.Property<A>,
    fn: (a: A) => B
): B.Property<B> {
    return observable.map(fn)
}
export const atom = A.atom
export const constant = B.constant
