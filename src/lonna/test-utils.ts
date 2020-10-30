import * as L from "lonna"
import { unmount, HarmajaOutput, HarmajaStaticOutput } from "../harmaja"

export function testRender<T>(init: T, test: (property: L.Property<T>, set: (v: T) => any) => HarmajaOutput) {
    const bus = L.bus<T>()
    const testScope = L.createScope() 
    testScope.start()
    const property = L.toProperty(init, testScope)(bus)
    const element = test(property, bus.push)
    unmount(element as HarmajaStaticOutput)
    // Verify that all subscribers are removed on unmount
    testScope.end()
    expect((property as any)._dispatcher.hasObservers()).toEqual(false)
}
export type Property<T> = L.Property<T>
export type Atom<T> = L.Property<T>
export type EventStream<T> = L.EventStream<T>
export function map<A, B>(p: L.Property<A>, fn: (a: A) => B): L.Property<B> {
    return L.map(fn)(p)
}
export const atom = L.atom
export const constant = L.constant
