import { Unsub } from "./abstractions";
import { Dispatcher } from "./dispatcher";
/**
 *  Defines the active lifetime of an Observable. You can use
 *  - globalScope: the observable will stay active forever, connected to its underlying data sources
 *  - autoScope: the observable will be active as long as it has observers (will throw if trying to re-activate)
 *  - custom scopes for, e.g. component lifetimes (between mount/unmount)
 **/
export declare type Scope = (onIn: () => Unsub, dispatcher: Dispatcher<any>) => void;
export interface MutableScope {
    apply: Scope;
    start(): void;
    end(): void;
}
export declare const globalScope: Scope;
export declare function scope(): MutableScope;
/**
 *  Subscribe to source when there are observers. Use with care!
 **/
export declare const autoScope: Scope;
export declare const beforeScope: {};
export declare const afterScope: {};
export declare type OutOfScope = (typeof beforeScope) | (typeof afterScope);
export declare function checkScope<V>(thing: any, value: V | OutOfScope): V;
