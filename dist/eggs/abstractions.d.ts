import { Callback } from "../harmaja";
import { Scope } from "./scope";
export declare type Observer<V> = (value: V) => void;
export declare type Unsub = Callback;
export declare abstract class Observable<V> {
    abstract forEach(observer: Observer<V>): Unsub;
}
export declare abstract class MulticastObservable<V, E extends string> extends Observable<V> {
    readonly desc: string;
    constructor(desc: string);
    abstract on(event: E, observer: Observer<V>): Unsub;
    abstract scope(): Scope;
    forEach(observer: Observer<V>): Unsub;
    log(message?: string): void;
    toString(): string;
}
export declare type PropertySubscribe<V> = (observer: Observer<V>) => [V, Unsub];
export declare abstract class Property<V> extends MulticastObservable<V, PropertyEventType> {
    constructor(desc: string);
    abstract get(): V;
    subscribe(observer: Observer<V>): [V, Unsub];
}
/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
export declare class PropertySeed<V> {
    subscribe: PropertySubscribe<V>;
    desc: string;
    constructor(desc: string, forEach: (observer: Observer<V>) => [V, Unsub]);
}
export declare type PropertyEventType = "value" | "change";
export declare type PropertyEvents<V> = {
    "value": V;
    "change": V;
};
export declare abstract class EventStream<V> extends MulticastObservable<V, StreamEventType> {
    constructor(desc: string);
}
export declare class EventStreamSeed<V> extends Observable<V> {
    forEach: (observer: Observer<V>) => Unsub;
    desc: string;
    constructor(desc: string, forEach: (observer: Observer<V>) => Unsub);
}
export declare type StreamEventType = "value";
export declare type StreamEvents<V> = {
    "value": V;
};
export declare abstract class Atom<V> extends Property<V> {
    constructor(desc: string);
    abstract set(newValue: V): void;
    abstract modify(fn: (old: V) => V): void;
}
/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
export declare class AtomSeed<V> extends PropertySeed<V> {
    set: (updatedValue: V) => void;
    constructor(desc: string, forEach: (observer: Observer<V>) => [V, Unsub], set: (updatedValue: V) => void);
}
export interface Bus<V> extends EventStream<V> {
    push(newValue: V): void;
}
