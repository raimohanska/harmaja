import * as B from "baconjs";
export declare const valueMissing: {};
export declare type ValueMissing = typeof valueMissing;
export declare function getCurrentValue<A>(observable: B.Property<A>): A;
export declare function reportValueMissing(observable: B.Observable<any>): never;
