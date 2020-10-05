import { EventStream, Observer } from "./abstractions";
import { StatefulProperty } from "./property";
import { Scope } from "./scope";

export function scan<A, B>(scope: Scope, stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B) {
    const source = (propertyAsChangeObserver: Observer<B>) => {
        let current = initial
        const unsub = stream.on("value", newValue => {
            current = fn(current, newValue)
            propertyAsChangeObserver(current)
        })
        return [initial, unsub] as any
    }    
    return new StatefulProperty<B>(stream + `.scan(fn)`, scope, source);
}