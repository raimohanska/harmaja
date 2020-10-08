import { Atom, AtomSeed, EventStream, EventStreamSeed, Observer, Property, PropertySeed } from "./abstractions";
import { applyScope } from "./applyscope";
import { Scope } from "./scope";
import { transform, Transformer } from "./transform";

export type Predicate<A> = (value: A) => boolean

export function filter<A>(prop: Atom<A> | AtomSeed<A>, fn: Predicate<A>): AtomSeed<A>;
export function filter<A>(prop: Atom<A> | AtomSeed<A>, fn: Predicate<A>, scope: Scope): Atom<A>;
export function filter<A>(prop: Property<A> | PropertySeed<A>, fn: Predicate<A>): PropertySeed<A>;
export function filter<A>(prop: Property<A> | PropertySeed<A>, fn: Predicate<A>, scope: Scope): Property<A>;
export function filter<A>(s: EventStream<A>, fn: Predicate<A>): EventStream<A>;
export function filter<A>(s: EventStreamSeed<A>, fn: Predicate<A>): EventStreamSeed<A>;

export function filter<A>(s: any, fn: Predicate<A>, scope?: Scope): any {
    const seed = transform(s + `.map(fn)`, s, filterT(fn))
    if (scope !== undefined) {
        return applyScope(scope, seed)
    }
    return seed;
}

function filterT<A>(fn: Predicate<A>): Transformer<A, A> {
    return {
        changes: (value: A, observer: Observer<A>) => {
            if (fn(value)) {
                observer(value)
            }
        },
        init: (value: A) => {
            if (!fn(value)) {
                throw Error(`Initial value not matching filter`)
            }
            return value
        }
    }
}