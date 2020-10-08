import { Atom, AtomSeed, EventStream, EventStreamSeed, Observer, Property, PropertySeed, PropertySubscribe } from "./abstractions"
import { applyScope } from "./applyscope"
import { atom } from "./atom"
import { Scope } from "./scope"

export type Transformer<A, B> = {
    changes: (value: A, observer: Observer<B>) => void;
    init: (value: A) => B;
}

export function transform<A, B>(desc: string, seed: EventStreamSeed<A> | EventStream<A>, transformer: Transformer<A, B>): EventStreamSeed<B>
export function transform<A, B>(desc: string, seed: PropertySeed<A> | Property<A>, transformer: Transformer<A, B>): PropertySeed<B>
export function transform<A, B>(desc: string, seed: EventStreamSeed<A> | EventStream<A>, transformer: Transformer<A, B>, scope: Scope): EventStream<B>
export function transform<A, B>(desc: string, seed: PropertySeed<A> | Property<A>, transformer: Transformer<A, B>, scope: Scope): Property<B>
export function transform<A>(desc: string, seed: AtomSeed<A> | Atom<A>, transformer: Transformer<A, A>): AtomSeed<A>

export function transform<A, B>(desc: string, x: any, transformer: Transformer<A, B>, scope?: Scope): any {
    let seed: any
    if (x instanceof EventStream || x instanceof EventStreamSeed) {
        seed = new EventStreamSeed(desc, observer =>  seed.forEach((value: A) => transformer.changes(value, observer)))
    } else if (x instanceof Atom || x instanceof AtomSeed) {
        seed = new AtomSeed(desc, transformSubscribe(x, transformer), newValue => x.set(newValue))
    } else if (x instanceof Property || x instanceof PropertySeed) {
        seed = new PropertySeed(desc, transformSubscribe(x, transformer))
    } else {
        throw Error("Unknown observable " + x)
    }
    if (scope !== undefined) {
        return applyScope(scope, seed)
    }
    return seed
}

function transformSubscribe<A, B>(src: { subscribe: PropertySubscribe<A> }, transformer: Transformer<A, B>): PropertySubscribe<B> {
    if (src === undefined) throw Error("Assertion failed")
    return (observer: Observer<B>) => {
        const [initial, unsub] = src.subscribe(value => transformer.changes(value, observer))
        return [transformer.init(initial), unsub]
    }
}
