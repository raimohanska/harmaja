import { EventStream, Observer, PropertySeed } from "./abstractions";

export function scan<A, B>(stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B): PropertySeed<B> {
    return new PropertySeed(stream + `.scan(fn)`, (observer: Observer<B>) => {
        let current = initial
        const unsub = stream.on("value", newValue => {
            current = fn(current, newValue)
            observer(current)
        })
        return [initial, unsub] as any
    });
}