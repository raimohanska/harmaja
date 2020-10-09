import { EventStream, EventStreamSeed } from "./abstractions";
import { StatelessEventStream } from "./eventstream";

export function merge<A>(a: EventStream<A>, b: EventStream<A>): EventStream<A>;
export function merge<A, B>(a: EventStream<A>, b: EventStream<B>): EventStream<A | B>;
export function merge<A>(a: EventStreamSeed<A>, b: EventStreamSeed<A>): EventStreamSeed<A>;
export function merge<A, B>(a: EventStreamSeed<A>, b: EventStreamSeed<B>): EventStreamSeed<A | B>;
export function merge<A>(...streams: (EventStream<any> | EventStreamSeed<any>)[]) {
    const seed = new EventStreamSeed<A>(`merge(${streams})`, observer => {
        const unsubs = streams.map(s => s.forEach(observer))
        return () => unsubs.forEach(f => f())
    })
    if (streams[0] instanceof EventStream) {
        return new StatelessEventStream(seed, streams[0].scope)
    }
    return seed
}