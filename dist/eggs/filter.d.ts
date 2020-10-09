import { Atom, AtomSeed, EventStream, EventStreamSeed, Property, PropertySeed } from "./abstractions";
import { Scope } from "./scope";
export declare type Predicate<A> = (value: A) => boolean;
export declare function filter<A>(prop: Atom<A> | AtomSeed<A>, fn: Predicate<A>): AtomSeed<A>;
export declare function filter<A>(prop: Atom<A> | AtomSeed<A>, fn: Predicate<A>, scope: Scope): Atom<A>;
export declare function filter<A>(prop: Property<A> | PropertySeed<A>, fn: Predicate<A>): PropertySeed<A>;
export declare function filter<A>(prop: Property<A> | PropertySeed<A>, fn: Predicate<A>, scope: Scope): Property<A>;
export declare function filter<A>(s: EventStream<A>, fn: Predicate<A>): EventStream<A>;
export declare function filter<A>(s: EventStreamSeed<A>, fn: Predicate<A>): EventStreamSeed<A>;
