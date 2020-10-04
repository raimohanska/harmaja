import { Observer, Unsub } from "./abstractions";
export interface Scope {
    on(event: "in" | "out", observer: Observer<void>): Unsub;
}
export interface MutableScope extends Scope {
    start(): void;
    end(): void;
}
export declare const GlobalScope: Scope;
export declare function scope(): MutableScope;
export declare const outOfScope: {};
export declare type OutOfScope = typeof outOfScope;
