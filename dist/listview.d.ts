import * as O from "./observables/observables";
import { HarmajaOutput } from "./harmaja";
export declare type ListViewProps<A, K = A> = {
    observable: O.NativeProperty<A[]>;
    renderObservable: (key: K, x: O.NativeProperty<A>) => HarmajaOutput;
    getKey: (x: A) => K;
} | {
    observable: O.NativeProperty<A[]>;
    renderItem: (x: A) => HarmajaOutput;
    getKey?: (x: A) => K;
} | {
    atom: O.NativeAtom<A[]>;
    renderAtom: (key: K, x: O.NativeAtom<A>, remove: () => void) => HarmajaOutput;
    getKey: (x: A) => K;
};
export declare function ListView<A, K>(props: ListViewProps<A, K>): ChildNode[];
