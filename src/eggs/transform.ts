import { EventStream, EventStreamSeed, Observer, Property, PropertySeed } from "./abstractions"

export type Transformer<A, B> = {
    changes: (value: A, observer: Observer<B>) => void;
    init: (value: A) => B;
}

export function transform<A, B>(desc: string, seed: EventStreamSeed<A> | EventStream<A>, transformer: Transformer<A, B>): EventStreamSeed<B>
export function transform<A, B>(desc: string, seed: PropertySeed<A> | Property<A>, transformer: Transformer<A, B>): PropertySeed<B>

export function transform<A, B>(desc: string, x: any, transformer: Transformer<A, B>): any {
    if (x instanceof EventStream || x instanceof EventStreamSeed) {
        return transformES(desc, x, transformer)
    } else if (x instanceof Property || x instanceof PropertySeed) {
        return transformP(desc, x, transformer)
    }
    throw Error("Unknown observable")
}

function transformES<A, B>(desc: string, seed: EventStreamSeed<A> | EventStream<A>, transformer: Transformer<A, B>): EventStreamSeed<B> {
    return new EventStreamSeed(desc, observer =>  seed.forEach((value: A) => transformer.changes(value, observer)))
}

function transformP<A, B>(desc: string, seed: PropertySeed<A> | Property<A>, transformer: Transformer<A, B>): PropertySeed<B> {
    return new PropertySeed(desc, (observer: Observer<B>) => {
        const [initial, unsub] = seed.subscribe(value => transformer.changes(value, observer))
        return [transformer.init(initial), unsub]
    })
}
