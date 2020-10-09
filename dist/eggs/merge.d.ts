import { EventStream, EventStreamSeed } from "./abstractions";
export declare function merge<A>(a: EventStream<A>, b: EventStream<A>): EventStream<A>;
export declare function merge<A>(a: EventStreamSeed<A>, b: EventStreamSeed<A>): EventStreamSeed<A>;
