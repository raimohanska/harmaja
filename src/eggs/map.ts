import { EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { StatelessEventStream } from "./eventstream";
import { DerivedProperty } from "./property";

// TODO: Map to value of Property (needs sampledBy)

export function map<A, B>(prop: Property<A>, fn: (value: A) => B): Property<B>;
export function map<A, B>(prop: PropertySeed<A>, fn: (value: A) => B): PropertySeed<B>;
export function map<A, B>(s: EventStream<A>, fn: (a: A) => B): EventStream<B>;
export function map<A, B>(s: EventStreamSeed<A>, fn: (a: A) => B): EventStreamSeed<B>;

export function map<A, B>(o: any, fn: (value: A) => B): any {
    const desc = o + `.map(fn)`;
    if (o instanceof EventStream) {
        return new StatelessEventStream(desc, observer => o.forEach(v => observer(fn(v))), o.scope())
    } else if (o instanceof EventStreamSeed) {
        return new EventStreamSeed(desc, observer => o.forEach(v => observer(fn(v))))
    } else if (o instanceof Property) {
        return new DerivedProperty(desc, [o], fn)
    } else if (o instanceof PropertySeed) {
        return new PropertySeed(desc, observer => {
            const [value, unsub] = o.subscribe(value => observer(fn(value)))        
            return [fn(value), unsub]
        })    
    }
    throw Error("Unknown observable")
}