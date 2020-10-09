import { Atom, AtomSeed, EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { Scope } from "./scope";
import { StatefulEventStream } from "./eventstream";
import { StatefulDependentAtom } from "./atom";
import { StatefulProperty } from "./property";

export function applyScope<T>(scope: Scope, stream: EventStreamSeed<T>): EventStream<T>;
export function applyScope<T>(scope: Scope, stream: AtomSeed<T>): Atom<T>;
export function applyScope<T>(scope: Scope, stream: PropertySeed<T>): Property<T>;

export function applyScope<T>(scope: Scope, seed: any): any {
    if (seed instanceof EventStreamSeed) {        
        return new SeedToStream(seed, scope)
    } else if (seed instanceof AtomSeed) {
        return new StatefulDependentAtom(seed, scope)
    } else if (seed instanceof PropertySeed) {
        return new StatefulProperty(seed, scope)
    }
    throw Error("Unknown seed")
}

class SeedToStream<V> extends StatefulEventStream<V> {
    constructor(seed: EventStreamSeed<V>, scope: Scope) { 
        super(seed.desc, scope)                 
        scope(
            () => seed.forEach(v => this.dispatcher.dispatch("value", v)),
            this.dispatcher            
        )
    }
}