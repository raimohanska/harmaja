import { Observer, Unsub } from "./abstractions";
export declare class Dispatcher<V, E extends string> {
    private subscribers;
    dispatch(key: E, value: V): void;
    on(key: E, subscriber: Observer<V>): Unsub;
    off(key: E, subscriber: Observer<V>): void;
    hasObservers(key: E): boolean;
}
