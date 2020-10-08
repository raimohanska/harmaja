import { Callback } from "../harmaja";
import { Scope } from "./scope";
export type Observer<V> = (value: V) => void
export type Unsub = Callback

// Abstract classes instead of interfaces for runtime type information and instanceof

export abstract class Observable<V> {
    abstract forEach(observer: Observer<V>): Unsub;
}

export abstract class MulticastObservable<V, E extends string> extends Observable<V> {
    readonly desc: string

    constructor(desc: string) {
        super()
        this.desc = desc;
    }
    abstract on(event: E, observer: Observer<V>): Unsub;
    abstract scope(): Scope;
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

export type PropertySubscribe<V> = (observer: Observer<V>) => [V, Unsub]

export abstract class Property<V> extends MulticastObservable<V, PropertyEventType> {
    constructor(desc: string) {
        super(desc)
    }

    abstract get(): V

    subscribe(observer: Observer<V>): [V, Unsub] {
        const unsub = this.on("change", observer)
        return [this.get(), unsub]
    }    
}

/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
export class PropertySeed<V> {
    subscribe: PropertySubscribe<V>
    desc: string;

    constructor(desc: string, forEach: (observer: Observer<V>) => [V, Unsub]) {
        this.subscribe = forEach
        this.desc = desc
    }
}

export type PropertyEventType = "value" | "change"
export type PropertyEvents<V> = { "value": V, "change": V }

export abstract class EventStream<V> extends MulticastObservable<V, StreamEventType> {
    constructor(desc: string) { 
        super(desc) 
    }
}

export class EventStreamSeed<V> extends Observable<V> {
    forEach: (observer: Observer<V>) => Unsub
    desc: string

    constructor(desc: string, forEach: (observer: Observer<V>) => Unsub) {
        super()
        this.forEach = forEach
        this.desc = desc
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

/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
export class AtomSeed<V> extends PropertySeed<V> {
    set: (updatedValue: V) => void;
    constructor(desc: string, forEach: (observer: Observer<V>) => [V, Unsub], set: (updatedValue: V) => void) {
        super(desc, forEach)
        this.set = set
    }
}

export interface Bus<V> extends EventStream<V> {
    push(newValue: V): void
}