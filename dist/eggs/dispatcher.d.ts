import { Observer, Unsub } from "./abstractions";
declare type Dict = {
    [key: string]: any;
};
export declare class Dispatcher<E extends Dict> {
    private observers;
    private count;
    dispatch<X extends keyof E & string>(key: X, value: E[X]): void;
    on<X extends keyof E & string>(key: X, subscriber: Observer<E[X]>): Unsub;
    off<X extends keyof E & string>(key: X, subscriber: Observer<E[X]>): void;
    onObserverCount(subscriber: Observer<number>): import("..").Callback;
    hasObservers(): boolean;
}
export {};
