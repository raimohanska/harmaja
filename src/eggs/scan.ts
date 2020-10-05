import { EventStream, Observer, PropertySeed } from "./abstractions";
import { StatefulProperty } from "./property";
import { Scope } from "./scope";

// TODO: separate scoping
export function scan<A, B>(scope: Scope, stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B) {
    const forEach = (propertyAsChangeObserver: Observer<B>) => {
        let current = initial
        const unsub = stream.on("value", newValue => {
            current = fn(current, newValue)
            propertyAsChangeObserver(current)
        })
        return [initial, unsub] as any
    }    
    const seed = new PropertySeed(stream + `.scan(fn)`, forEach);
    return new StatefulProperty<B>(seed, scope)
}