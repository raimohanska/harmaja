export interface Lens<A, B> {
    get(root: A): B;
    set(root: A, newValue: B): A;
}
export declare function prop<A, K extends keyof A>(key: K): Lens<A, A[K]>;
export declare function item<I>(index: number): Lens<I[], I | undefined>;
