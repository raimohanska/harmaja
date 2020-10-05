import { Observer, Property, PropertySeed } from "./abstractions";
import { StatefulProperty } from "./property";
import { Scope } from "./scope";

// TODO: apply to seeds and observables (freezeUnless is actually filter for Atoms!)

export function filter<A>(scope: Scope, prop: Property<A>, predicate: (value: A) => boolean): Property<A> {
    const forEach = (propertyAsChangeObserver: Observer<A>) => {
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
    const seed = new PropertySeed(prop + `.map(fn)`, forEach)
    return new StatefulProperty<A>(seed, scope);
}