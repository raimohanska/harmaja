import * as Bacon from "baconjs";
export declare type HarmajaComponent = (props: HarmajaProps) => DOMNode;
export declare type JSXElementType = string | HarmajaComponent;
export declare type HarmajaProps = Record<string, any>;
export declare type HarmajaChild = HarmajaObservableChild | DOMNode | string | number | null;
export declare type HarmajaChildren = (HarmajaChild | HarmajaChildren)[];
export declare type HarmajaChildOrChildren = HarmajaChild | HarmajaChildren;
export declare type HarmajaObservableChild = Bacon.Property<HarmajaChildOrChildren>;
export declare type HarmajaOutput = DOMNode | HarmajaOutput[];
export declare type DOMNode = ChildNode;
/**
 *  Element constructor used by JSX.
 */
export declare function createElement(type: JSXElementType, props: HarmajaProps, ...children: HarmajaChildren): HarmajaOutput;
declare function createPlaceholder(): Text;
export declare type Callback = () => void;
export declare type NodeController = {
    unsub?: Callback;
    currentElements: DOMNode[];
};
/**
 *  Mounts the given element to the document, replacing the given root element.
 *
 *  - Causes the component to be activated, i.e. to start listening to observables
 *  - `onMount` callbacks will be called
 *  - `onMountEvent` will be triggered
 */
export declare function mount(harmajaElement: HarmajaOutput, root: Element): void;
/**
 *  Unmounts the given element, removing it from the DOM.
 *
 *  - Causes the component to be deactivated, i.e. to stop listening to observables
 *  - `onUnmount` callbacks will be called
 *  - `onUnmountEvent` will be triggered
 */
export declare function unmount(harmajaElement: HarmajaOutput): void;
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
export declare function callOnMounts(element: Node): void;
declare function attachOnMount(element: DOMNode, onMount: Callback): void;
declare function attachOnUnmount(element: DOMNode, onUnmount: Callback): void;
declare function detachOnUnmount(element: DOMNode, onUnmount: Callback): void;
declare function detachOnUnmounts(element: DOMNode): Callback[];
declare function detachController(oldElements: ChildNode[], controller: NodeController): void;
declare function attachController(controller: NodeController, bootstrap?: () => Callback): void;
declare function replaceElement(oldElement: ChildNode, newElement: DOMNode): void;
declare function replaceMany(oldContent: HarmajaOutput, newContent: HarmajaOutput): void;
declare function addAfterElement(current: ChildNode, next: ChildNode): void;
declare function toDOMElements(elements: HarmajaOutput): DOMNode[];
declare function removeElement(oldElement: HarmajaOutput): void;
declare function appendElement(rootElement: DOMNode, child: DOMNode): void;
export declare function debug(element: HarmajaOutput | Node): string;
export declare const LowLevelApi: {
    createPlaceholder: typeof createPlaceholder;
    attachOnMount: typeof attachOnMount;
    attachOnUnmount: typeof attachOnUnmount;
    detachOnUnmount: typeof detachOnUnmount;
    detachOnUnmounts: typeof detachOnUnmounts;
    attachController: typeof attachController;
    detachController: typeof detachController;
    appendElement: typeof appendElement;
    removeElement: typeof removeElement;
    addAfterElement: typeof addAfterElement;
    replaceElement: typeof replaceElement;
    replaceMany: typeof replaceMany;
    toDOMElements: typeof toDOMElements;
};
export {};
