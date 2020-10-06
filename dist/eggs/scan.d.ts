import { EventStream, PropertySeed } from "./abstractions";
import { Scope } from "./scope";
export declare function scan<A, B>(stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B): PropertySeed<B>;
export declare function scan<A, B>(stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B, scope: Scope): PropertySeed<B>;
