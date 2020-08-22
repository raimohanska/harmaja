import * as Bacon from "baconjs";
export declare type VDOMComponent = (props: VDOMProps) => VDOMElement;
export declare type VDOMType = string | VDOMComponent;
export declare type VDOMProps = Record<string, any>;
export declare type VDOMChild = VDOMElement | string | number | VDOMObservableChild | null;
export declare type VDOMStandardElement = {
    type: string;
    props: VDOMProps;
    children: VDOMChild[];
};
export declare type VDOMElement = VDOMStandardElement | VDOMCustomElement;
export declare type VDOMObservableChild = Bacon.Property<VDOMElement | string>;
export declare type VDOMCustomElement = {
    type: "_custom_";
    renderHTML: () => any;
    key: "";
    props: {};
};
export declare function createElement(type: VDOMType, props: VDOMProps, ...children: (VDOMChild | VDOMChild[])[]): VDOMElement;
export declare const React: {
    createElement: typeof createElement;
};
export declare function mount(ve: VDOMElement | any, root: HTMLElement): void;
export declare function renderHTML(ve: VDOMChild): HTMLElement | Text;
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
