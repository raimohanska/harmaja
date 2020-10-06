import { Atom, AtomSeed, EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { Scope } from "./scope";
export declare function applyScope<T>(scope: Scope, stream: EventStreamSeed<T>): EventStream<T>;
export declare function applyScope<T>(scope: Scope, stream: AtomSeed<T>): Atom<T>;
export declare function applyScope<T>(scope: Scope, stream: PropertySeed<T>): Property<T>;
