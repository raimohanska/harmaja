import { Atom, AtomSeed, EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { Scope } from "./scope";
import { BaseEventStream } from "./eventstream";
import { StatefulDependentAtom } from "./atom";
import { StatefulProperty } from "./property";

// TODO: pipe, curry

export function applyScope<T>(stream: EventStreamSeed<T>, scope: Scope): EventStream<T>;
export function applyScope<T>(stream: AtomSeed<T>, scope: Scope): Atom<T>;
export function applyScope<T>(stream: PropertySeed<T>, scope: Scope): Property<T>;

export function applyScope<T>(seed: any, scope: Scope): any {
    if (seed instanceof EventStreamSeed) {        
        return new SeedToStream(seed, scope)
    } else if (seed instanceof AtomSeed) {
        return new StatefulDependentAtom(seed, scope)
    } else if (seed instanceof PropertySeed) {
        return new StatefulProperty(seed, scope)
    }
    throw Error("Unknown seed")
}

class SeedToStream<V> extends BaseEventStream<V> {
    constructor(seed: EventStreamSeed<V>, scope: Scope) { 
        super(seed.desc, scope)                 
        scope(
            () => seed.forEach(v => this.dispatcher.dispatch("value", v)),
            this.dispatcher            
        )
    }
}