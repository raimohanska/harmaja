import { Atom, AtomSeed, EventStream, EventStreamSeed, Observer, Property, PropertySeed } from "./abstractions";
import { Scope } from "./scope";
export declare type Transformer<A, B> = {
    changes: (value: A, observer: Observer<B>) => void;
    init: (value: A) => B;
};
export declare function transform<A, B>(desc: string, seed: EventStreamSeed<A> | EventStream<A>, transformer: Transformer<A, B>): EventStreamSeed<B>;
export declare function transform<A, B>(desc: string, seed: PropertySeed<A> | Property<A>, transformer: Transformer<A, B>): PropertySeed<B>;
export declare function transform<A, B>(desc: string, seed: EventStreamSeed<A> | EventStream<A>, transformer: Transformer<A, B>, scope: Scope): EventStream<B>;
export declare function transform<A, B>(desc: string, seed: PropertySeed<A> | Property<A>, transformer: Transformer<A, B>, scope: Scope): Property<B>;
export declare function transform<A>(desc: string, seed: AtomSeed<A> | Atom<A>, transformer: Transformer<A, A>): AtomSeed<A>;
