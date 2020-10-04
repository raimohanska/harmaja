import { EventStream, Observer } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { Scope } from "./scope";
export declare class BaseEventStream<V> extends EventStream<V> {
    protected dispatcher: Dispatcher<V, "value">;
    constructor();
    on(event: "value", observer: Observer<V>): import("./abstractions").Unsub;
}
export declare function never<A>(): EventStream<A>;
export declare function interval<V>(scope: Scope, delay: number, value: V): Interval<V>;
declare class Interval<V> extends BaseEventStream<V> {
    constructor(scope: Scope, delay: number, value: V);
}
export {};
