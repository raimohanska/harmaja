import * as Bacon from "baconjs"

export type VDOMComponent = (props: VDOMProps) => FlattenedDOMElement
export type VDOMType = string | VDOMComponent
export type VDOMChild = VDOMElement | string | number | VDOMObservableChild | null
export type VDOMProps = Record<string, any>
export type VDOMElement = VDOMComponentElement | VDOMPlainElement | VDOMCustomElement
export type VDOMCustomElement = { type: "_custom_", renderHTML: () => any, key: "", props: {} } // the boilerplate is for JSX compatibility
export type VDOMComponentElement = { type: VDOMComponent, props: VDOMProps, children: VDOMChild[] }
export type VDOMPlainElement = { type: string, props: VDOMProps, children: VDOMChild[] }
export type VDOMObservableChild = Bacon.Property<VDOMElement | string>

// The flattened elements do not contain Components; the components are replaced with the output of their rendering function
export type FlattenedDOMElement = FlattenedDOMStandardElement | VDOMCustomElement
export type FlattenedDOMStandardElement = { type: string, props: VDOMProps, children: FlattenedDOMChild[] }
export type FlattenedDOMChild = FlattenedDOMElement | string | number | null | VDOMObservableChild

export function createElement(type: VDOMType, props: VDOMProps, ...children: (VDOMChild | VDOMChild[])[]): FlattenedDOMElement {
    throw Error("Not implemented")
}

export interface IntrinsicElements {
    a: HTMLAttributes<HTMLAnchorElement>;
}

interface HTMLAttributes<RefType extends EventTarget = EventTarget> {		
		// Standard HTML Attributes
        accept?: string;
}