import { EventStream, EventStreamSeed, Observer, Property, PropertySeed } from "./abstractions";
import { applyScope } from "./applyscope";
import { Scope } from "./scope";

export function scan<A, B>(stream: EventStream<A> | EventStreamSeed<A>, initial: B, fn: (state: B, next: A) => B, scope: Scope): Property<B>;
export function scan<A, B>(stream: EventStream<A> | EventStreamSeed<A>, initial: B, fn: (state: B, next: A) => B): PropertySeed<B>;

export function scan<A, B>(stream: EventStream<A> | EventStreamSeed<A>, initial: B, fn: (state: B, next: A) => B, scope?: Scope): any {
    const seed = new PropertySeed(stream + `.scan(fn)`, (observer: Observer<B>) => {
        let current = initial
        const unsub = stream.forEach(newValue => {
            current = fn(current, newValue)
            observer(current)
        })
        return [initial, unsub] as any
    });
    if (scope) return applyScope(scope, seed)
    return seed
}