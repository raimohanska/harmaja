import { Callback } from "../harmaja";
export declare type Observer<V> = (value: V) => void;
export declare type Unsub = Callback;
export declare abstract class Observable<V, E extends string> {
    private desc;
    constructor(desc: string);
    abstract on(event: E, observer: Observer<V>): Unsub;
    forEach(observer: Observer<V>): Unsub;
    log(message?: string): void;
    toString(): string;
}
export declare abstract class Property<V> extends Observable<V, PropertyEventType> {
    constructor(desc: string);
    abstract get(): V;
}
export declare type PropertyEventType = "value" | "change";
export declare type PropertyEvents<V> = {
    "value": V;
    "change": V;
};
export declare abstract class EventStream<V> extends Observable<V, StreamEventType> {
    constructor(desc: string);
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
export interface Bus<V> extends EventStream<V> {
    push(newValue: V): void;
}
