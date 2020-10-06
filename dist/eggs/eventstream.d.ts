import { EventStream, Observer, StreamEvents, EventStreamSeed } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { Scope } from "./scope";
export declare class BaseEventStream<V> extends EventStream<V> {
    protected dispatcher: Dispatcher<StreamEvents<V>>;
    private _scope;
    constructor(desc: string, scope: Scope);
    on(event: "value", observer: Observer<V>): import("..").Callback;
    scope(): Scope;
}
export declare function never<A>(): EventStream<A>;
export declare function interval<V>(delay: number, value: V): EventStreamSeed<V>;
