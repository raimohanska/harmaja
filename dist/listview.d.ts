import * as Bacon from "baconjs";
import { Atom } from "./atom";
export declare type ListViewProps<A, K = A> = {
    observable: Bacon.Property<A[]>;
    renderObservable: (key: K, x: Bacon.Property<A>) => any;
    key: (x: A) => K;
} | {
    observable: Bacon.Property<A[]>;
    renderItem: (x: A) => any;
    key?: (x: A) => K;
} | {
    atom: Atom<A[]>;
    renderAtom: (key: K, x: Atom<A>, remove: () => void) => any;
    key: (x: A) => K;
};
export declare function ListView<A, K>(props: ListViewProps<A, K>): HTMLSpanElement;
