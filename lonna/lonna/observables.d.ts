import * as O from "lonna";
export declare type NativeProperty<T> = O.Property<T>;
export declare type NativeAtom<T> = O.Property<T>;
export declare type NativeEventStream<T> = O.EventStream<T>;
export declare type Scope = O.Scope;
export declare type Predicate<A> = (value: A) => boolean;
export declare type Observable<T> = {};
export declare type Atom<T> = {};
export declare type Property<T> = {};
export declare type EventStream<T> = {};
export interface Bus<T> extends NativeEventStream<T> {
}
export declare type Unsub = () => void;
export declare function pushAndEnd<T>(bus: Bus<T>, value: T): void;
export declare function bus<T>(): Bus<T>;
export declare function get<A>(prop: Property<A>): A;
export declare function set<A>(atom: Atom<A>, value: A): void;
export declare function isProperty(x: any): x is Property<any>;
export declare function forEach<V>(x: Observable<V>, fn: (value: V) => void): Unsub;
export declare function view<A, K extends keyof A>(a: Atom<A>, key: number): Atom<A[K] | undefined>;
export declare function view<A, K extends keyof A>(a: Property<A>, key: number): Property<A[K] | undefined>;
export declare function filter<A>(prop: Atom<A>, fn: Predicate<A>): Atom<A>;
export declare function filter<A>(prop: Property<A>, fn: Predicate<A>): Property<A>;
export declare const observablesThrowError = true;
export declare const observablesImplementationName = "Lonna";
