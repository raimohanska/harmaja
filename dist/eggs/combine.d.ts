import { Property } from "./abstractions";
export declare type Function0<R> = () => R;
export declare type Function1<T1, R> = (t1: T1) => R;
export declare type Function2<T1, T2, R> = (t1: T1, t2: T2) => R;
export declare type Function3<T1, T2, T3, R> = (t1: T1, t2: T2, t3: T3) => R;
export declare type Function4<T1, T2, T3, T4, R> = (t1: T1, t2: T2, t3: T3, t4: T4) => R;
export declare type Function5<T1, T2, T3, T4, T5, R> = (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => R;
export declare type Function6<T1, T2, T3, T4, T5, T6, R> = (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => R;
/**
  Combines given *n* Properties and
  EventStreams using the given n-ary function `f(v1, v2 ...)`.

  To calculate the current sum of three numeric Properties, you can do

```js
function sum3(x,y,z) { return x + y + z }
    combine(sum3, p1, p2, p3)
```
*/
export declare function combine<R>(fn: Function0<R>): Property<R>;
export declare function combine<V, R>(a: Property<V>, fn: Function1<V, R>): Property<R>;
export declare function combine<V, V2, R>(a: Property<V>, b: Property<V2>, fn: Function2<V, V2, R>): Property<R>;
export declare function combine<V, V2, V3, R>(a: Property<V>, b: Property<V2>, c: Property<V3>, fn: Function3<V, V2, V3, R>): Property<R>;
export declare function combine<V, V2, V3, V4, R>(a: Property<V>, b: Property<V2>, c: Property<V3>, d: Property<V4>, fn: Function4<V, V2, V3, V4, R>): Property<R>;
export declare function combine<V, V2, V3, V4, V5, R>(a: Property<V>, b: Property<V2>, c: Property<V3>, d: Property<V4>, e: Property<V5>, fn: Function5<V, V2, V3, V4, V5, R>): Property<R>;
export declare function combine<V, V2, V3, V4, V5, V6, R>(a: Property<V>, b: Property<V2>, c: Property<V3>, d: Property<V4>, e: Property<V5>, f: Property<V6>, fn: Function6<V, V2, V3, V4, V5, V6, R>): Property<R>;
export declare function combine<R>(Propertys: Property<any>[], fn: Function): Property<R>;
export declare function combine<V, R>(fn: Function1<V, R>, a: Property<V>): Property<R>;
export declare function combine<V, V2, R>(fn: Function2<V, V2, R>, a: Property<V>, b: Property<V2>): Property<R>;
export declare function combine<V, V2, V3, R>(fn: Function3<V, V2, V3, R>, a: Property<V>, b: Property<V2>, c: Property<V3>): Property<R>;
export declare function combine<V, V2, V3, V4, R>(fn: Function4<V, V2, V3, V4, R>, a: Property<V>, b: Property<V2>, c: Property<V3>, d: Property<V4>): Property<R>;
export declare function combine<V, V2, V3, V4, V5, R>(fn: Function5<V, V2, V3, V4, V5, R>, a: Property<V>, b: Property<V2>, c: Property<V3>, d: Property<V4>, e: Property<V5>): Property<R>;
export declare function combine<V, V2, V3, V4, V5, V6, R>(fn: Function6<V, V2, V3, V4, V5, V6, R>, a: Property<V>, b: Property<V2>, c: Property<V3>, d: Property<V4>, e: Property<V5>, f: Property<V6>): Property<R>;
export declare function combine<R>(fn: Function, Propertys: Property<any>[]): Property<R>;
