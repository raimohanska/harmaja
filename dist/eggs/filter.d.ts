import { Property } from "./abstractions";
import { Scope } from "./scope";
export declare function filter<A>(scope: Scope, prop: Property<A>, predicate: (value: A) => boolean): Property<A>;
