import { EventStream, Observer, StreamEvents, Unsub, EventStreamSeed } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { Scope } from "./scope";
export declare class StatefulEventStream<V> extends EventStream<V> {
    protected dispatcher: Dispatcher<StreamEvents<V>>;
    private _scope;
    constructor(desc: string, scope: Scope);
    on(event: "value", observer: Observer<V>): import("..").Callback;
    scope(): Scope;
}
export declare class StatelessEventStream<V> extends EventStream<V> {
    private _scope;
    forEach: (observer: Observer<V>) => Unsub;
    constructor(desc: string, forEach: (observer: Observer<V>) => Unsub, scope: Scope);
    constructor(seed: EventStreamSeed<V>, scope: Scope);
    on(event: "value", observer: Observer<V>): import("..").Callback;
    scope(): Scope;
}
