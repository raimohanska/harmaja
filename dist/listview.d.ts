import * as Bacon from "baconjs";
import { Atom } from "./atom";
export declare type ListViewProps<A> = {
    observable: Bacon.Property<A[]>;
    renderObservable: (x: Bacon.Property<A>) => any;
    equals: (x: A, y: A) => boolean;
} | {
    observable: Bacon.Property<A[]>;
    renderItem: (x: A) => any;
    equals?: (x: A, y: A) => boolean;
} | {
    atom: Atom<A[]>;
    renderAtom: (x: Atom<A>, remove: () => void) => any;
    equals: (x: A, y: A) => boolean;
};
export declare function ListView<A>(props: ListViewProps<A>): HTMLSpanElement;
