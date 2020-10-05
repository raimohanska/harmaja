import { Observer, Property } from "./abstractions";
import { StatefulProperty } from "./property";
import { Scope } from "./scope";

export function filter<A>(scope: Scope, prop: Property<A>, predicate: (value: A) => boolean): Property<A> {
    const source = (propertyAsChangeObserver: Observer<A>) => {
        const unsub = prop.on("change", newValue => {
            if (predicate(newValue)) {
                propertyAsChangeObserver(newValue)
            }
        })
        const initialValue = prop.get()
        if (!predicate(initialValue)) {
            throw Error(`Initial value not matching filter for ${prop}`)
        }
        return [initialValue, unsub] as any
    }

    return new StatefulProperty<A>(prop + `.map(fn)`, scope, source);
}