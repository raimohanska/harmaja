import * as Bacon from "baconjs";
export declare type HarmajaComponent = (props: HarmajaProps) => DOMElement;
export declare type JSXElementType = string | HarmajaComponent;
export declare type HarmajaProps = Record<string, any>;
export declare type HarmajaChild = HarmajaObservableChild | DOMElement | string | number | null;
export declare type HarmajaObservableChild = Bacon.Property<HarmajaChild>;
export declare type DOMElement = HTMLElement | Text;
/**
 *  Mounts the given element to the document, replacing the given root element.
 *
 *  - Causes the component to be activated, i.e. to start listening to observables
 *  - `onMount` callbacks will be called
 *  - `onMountEvent` will be triggered
 */
export declare function mount(harmajaElement: DOMElement, root: HTMLElement): void;
/**
 *  Unmounts the given element, removing it from the DOM.
 *
 *  - Causes the component to be deactivated, i.e. to stop listening to observables
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export declare function unmount(harmajaElement: DOMElement): void;
declare type Callback = () => void;
/**
 *  Element constructor used by JSX.
 */
export declare function createElement(type: JSXElementType, props: HarmajaProps, ...children: (HarmajaChild | HarmajaChild[])[]): DOMElement;
/**
 *  Add onMount callback. Called once after the component has been mounted on the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export declare function onMount(callback: Callback): void;
/**
 *  Add onUnmount callback. Called once after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export declare function onUnmount(callback: Callback): void;
/**
 *  The onMount event as EventStream, emitting a value after the component has been mounted to the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export declare function mountEvent(): Bacon.EventStream<void>;
/**
 *  The onUnmount event as EventStream, emitting a value after the component has been unmounted from the document.
 *  NOTE: Call only in component constructors. Otherwise will not do anything useful.
 */
export declare function unmountEvent(): Bacon.EventStream<void>;
export declare function callOnMounts(element: Element | Text | ChildNode): void;
declare function attachOnMount(element: HTMLElement | Text, onMount: Callback): void;
declare function attachOnUnmount(element: HTMLElement | Text, onUnmount: Callback): void;
declare function replaceElement(oldElement: ChildNode, newElement: HTMLElement | Text): void;
declare function removeElement(oldElement: ChildNode): void;
declare function appendElement(rootElement: HTMLElement, child: DOMElement): void;
export declare function debug(element: DOMElement | ChildNode): string | null;
export declare const LowLevelApi: {
    attachOnMount: typeof attachOnMount;
    attachOnUnmount: typeof attachOnUnmount;
    appendElement: typeof appendElement;
    removeElement: typeof removeElement;
    replaceElement: typeof replaceElement;
};
export {};
