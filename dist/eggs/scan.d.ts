import { EventStream, PropertySeed } from "./abstractions";
export declare function scan<A, B>(stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B): PropertySeed<B>;
