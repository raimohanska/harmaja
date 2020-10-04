import { map } from "./property"

export type Observer<V> = (value: V) => void
export type Unsub = () => void

// Abstract classes instead of interfaces for runtime type information and instanceof

export abstract class Observable<V, E extends string> {
    constructor() {}
    abstract on(event: E, observer: Observer<V>): Unsub;
    forEach(observer: Observer<V>): Unsub {
        return this.on("value" as E, observer)
    }
    log(message?: string) {
        this.forEach(v => message === undefined ? console.log(v) : console.log(message, v))
    }
}

export abstract class Property<V> extends Observable<V, PropertyEventType> {
    constructor() { super() }
    abstract get(): V
}

export type PropertyEventType = "value" | "change"

export abstract class EventStream<V> extends Observable<V, StreamEventType> {
    constructor() { super() }
}

export type StreamEventType = "value"

export abstract class Atom<V> extends Property<V> {
    constructor() { super() }
    abstract set(newValue: V): void
    abstract modify(fn: (old: V) => V): void
}

export interface Bus<V> extends EventStream<V> {
    push(newValue: V): void
}