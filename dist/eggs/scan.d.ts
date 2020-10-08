import { EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { Scope } from "./scope";
export declare function scan<A, B>(stream: EventStream<A> | EventStreamSeed<A>, initial: B, fn: (state: B, next: A) => B, scope: Scope): Property<B>;
export declare function scan<A, B>(stream: EventStream<A> | EventStreamSeed<A>, initial: B, fn: (state: B, next: A) => B): PropertySeed<B>;
