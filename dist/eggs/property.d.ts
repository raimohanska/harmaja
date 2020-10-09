import { EventStream, EventStreamSeed, Observer, Property, PropertyEvents, PropertyEventType, PropertySeed } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { Scope } from "./scope";
export declare abstract class StatefulPropertyBase<V> extends Property<V> {
    protected dispatcher: Dispatcher<PropertyEvents<V>>;
    abstract get(): V;
    constructor(desc: string);
    on(event: PropertyEventType, observer: Observer<V>): import("..").Callback;
}
export declare class DerivedProperty<V> extends Property<V> {
    private sources;
    private combinator;
    constructor(desc: string, sources: Property<any>[], combinator: (...inputs: any[]) => V);
    get(): V;
    private getCurrentArray;
    on(event: PropertyEventType, observer: Observer<V>): () => void;
    scope(): Scope;
}
export declare class StatefulProperty<V> extends StatefulPropertyBase<V> {
    private _scope;
    private value;
    constructor(seed: PropertySeed<V>, scope: Scope);
    get(): V;
    scope(): Scope;
}
export declare function toPropertySeed<A>(stream: EventStream<A> | EventStreamSeed<A>, initial: A): PropertySeed<A>;
export declare function toPropertySeed<A, B>(stream: EventStream<A> | EventStreamSeed<A>, initial: B): PropertySeed<A | B>;
export declare function toProperty<A>(stream: EventStream<A> | EventStreamSeed<A>, initial: A, scope: Scope): Property<A>;
export declare function toProperty<A, B>(stream: EventStream<A> | EventStreamSeed<A>, initial: B, scope: Scope): Property<A | B>;
export declare function constant<A>(value: A): Property<A>;
