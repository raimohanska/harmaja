import { Callback } from "../harmaja";
export type Observer<V> = (value: V) => void
export type Unsub = Callback

// Abstract classes instead of interfaces for runtime type information and instanceof

export abstract class Observable<V, E extends string> {
    private desc: string

    constructor(desc: string) {
        this.desc = desc;
    }
    abstract on(event: E, observer: Observer<V>): Unsub;
    forEach(observer: Observer<V>): Unsub {
        return this.on("value" as E, observer)
    }
    log(message?: string) {
        this.forEach(v => message === undefined ? console.log(v) : console.log(message, v))
    }
    toString(): string {
        return this.desc
    }
}

export abstract class Property<V> extends Observable<V, PropertyEventType> {
    constructor(desc: string) {
        super(desc)
    }

    abstract get(): V
}

export type PropertyEventType = "value" | "change"
export type PropertyEvents<V> = { "value": V, "change": V }

export abstract class EventStream<V> extends Observable<V, StreamEventType> {
    constructor(desc: string) { 
        super(desc) 
    }
}

export type StreamEventType = "value"
export type StreamEvents<V> = { "value": V }

export abstract class Atom<V> extends Property<V> {
    constructor(desc: string) { 
        super(desc) 
    }
    abstract set(newValue: V): void
    abstract modify(fn: (old: V) => V): void
}

export interface Bus<V> extends EventStream<V> {
    push(newValue: V): void
}