import * as Bacon from "baconjs";
export declare type VDOMComponent = (props: VDOMProps) => FlattenedDOMElement;
export declare type VDOMType = string | VDOMComponent;
export declare type VDOMChild = VDOMElement | string | number | VDOMObservableChild | null;
export declare type VDOMProps = Record<string, any>;
export declare type VDOMElement = VDOMComponentElement | VDOMPlainElement | VDOMCustomElement;
export declare type VDOMCustomElement = {
    type: "_custom_";
    renderHTML: () => any;
    key: "";
    props: {};
};
export declare type VDOMComponentElement = {
    type: VDOMComponent;
    props: VDOMProps;
    children: VDOMChild[];
};
export declare type VDOMPlainElement = {
    type: string;
    props: VDOMProps;
    children: VDOMChild[];
};
export declare type VDOMObservableChild = Bacon.Property<VDOMElement | string>;
export declare type FlattenedDOMElement = FlattenedDOMStandardElement | VDOMCustomElement;
export declare type FlattenedDOMStandardElement = {
    type: string;
    props: VDOMProps;
    children: FlattenedDOMChild[];
};
export declare type FlattenedDOMChild = FlattenedDOMElement | string | number | null | VDOMObservableChild;
export declare function createElement(type: VDOMType, props: VDOMProps, ...children: (VDOMChild | VDOMChild[])[]): FlattenedDOMElement;
export declare function flattenChild(child: VDOMChild): FlattenedDOMChild;
export declare function flattenElement(e: VDOMElement): FlattenedDOMElement;
export declare const React: {
    createElement: typeof createElement;
};
export declare function mount(ve: FlattenedDOMElement | any, root: HTMLElement): void;
export declare function renderHTML(ve: FlattenedDOMChild): HTMLElement | Text;
export declare function attachUnsub(element: HTMLElement | Text, unsub: Bacon.Unsub): void;
export declare function getCurrentValue<A>(observable: Bacon.Property<A>): A;
export declare function createCustomElement(renderHTML: () => HTMLElement | Text): {
    key: string;
    type: string;
    props: {};
    renderHTML: () => HTMLElement | Text;
};
export declare function replaceElement(oldElement: ChildNode, newElement: HTMLElement | Text): void;
export declare function removeElement(oldElement: ChildNode): void;
