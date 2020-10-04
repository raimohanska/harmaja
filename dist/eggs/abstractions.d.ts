export declare type Observer<V> = (value: V) => void;
export declare type Unsub = () => void;
export declare abstract class Observable<V, E extends string> {
    constructor();
    abstract on(event: E, observer: Observer<V>): Unsub;
    forEach(observer: Observer<V>): Unsub;
    log(message?: string): void;
}
export declare abstract class Property<V> extends Observable<V, PropertyEventType> {
    constructor();
    abstract get(): V;
}
export declare type PropertyEventType = "value" | "change";
export declare abstract class EventStream<V> extends Observable<V, StreamEventType> {
    constructor();
}
export declare type StreamEventType = "value";
export declare abstract class Atom<V> extends Property<V> {
    constructor();
    abstract set(newValue: V): void;
    abstract modify(fn: (old: V) => V): void;
}
export interface Bus<V> extends EventStream<V> {
    push(newValue: V): void;
}
