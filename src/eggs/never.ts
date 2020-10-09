import { EventStream } from "./abstractions";
import { StatefulEventStream } from "./eventstream";
import { globalScope } from "./scope";
export function never<A>(): EventStream<A> {
    return new StatefulEventStream("never", globalScope)
}