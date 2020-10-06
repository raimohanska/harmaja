import { EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { applyScope } from "./applyscope";
import { DerivedProperty } from "./property";


export function map<A, B>(prop: Property<A>, fn: (value: A) => B): Property<B>;
export function map<A, B>(s: EventStream<A>, fn: (a: A) => B): EventStream<B>;
export function map<A, B>(s: EventStreamSeed<A>, fn: (a: A) => B): EventStreamSeed<B>;

export function map<A, B>(o: any, fn: (value: A) => B): any {
    if (o instanceof EventStream) {
        return mapES(o, fn)
    } else if (o instanceof EventStreamSeed) {
        return mapESS(o, fn)
    } else if (o instanceof Property) {
        return mapP(o, fn)
    } else if (o instanceof PropertySeed) {
        return mapPS(o, fn)
    }
    throw Error("Unknown observable")
}

function mapES<A, B>(s: EventStream<A>, fn: (a: A) => B): EventStream<B> {
    return applyScope(s.scope(), mapESS(s, fn))
}
function mapESS<A, B>(s: EventStreamSeed<A>, fn: (a: A) => B): EventStreamSeed<B> {
    return new EventStreamSeed(s + `.map(fn)`, observer => s.forEach(v => observer(fn(v))))
}
function mapP<A, B>(prop: Property<A>, fn: (value: A) => B): Property<B> {
    return new DerivedProperty(prop + `.map(fn)`, [prop], fn)
}
function mapPS<A, B>(seed: PropertySeed<A>, fn: (value: A) => B): PropertySeed<B> {
    return new PropertySeed(seed + `.map(fn)`, observer => {
        const [value, unsub] = seed.subscribe(value => observer(fn(value)))        
        return [fn(value), unsub]
    })    
}