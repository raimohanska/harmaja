import { HarmajaOutput } from "./harmaja";
import * as B from "./eggs/eggs";
export declare type ListViewProps<A, K = A> = {
    observable: B.Property<A[]>;
    renderObservable: (key: K, x: B.Property<A>) => HarmajaOutput;
    getKey: (x: A) => K;
} | {
    observable: B.Property<A[]>;
    renderItem: (x: A) => HarmajaOutput;
    getKey?: (x: A) => K;
} | {
    atom: B.Atom<A[]>;
    renderAtom: (key: K, x: B.Atom<A>, remove: () => void) => HarmajaOutput;
    getKey: (x: A) => K;
};
export declare function ListView<A, K>(props: ListViewProps<A, K>): ChildNode[];
