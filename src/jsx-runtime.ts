import {
    createElement,
    JSXElementType,
    HarmajaProps,
    HarmajaOutput,
} from "./harmaja"

export { Fragment } from "./harmaja"

// the jsx function is called when the children prop is a dynamically created array:
// <div>
//   { someArray.map(() => <div />) }
// </div>
export function jsx(
    type: JSXElementType,
    props: HarmajaProps,
    maybeKey?: string
): HarmajaOutput {
    const { children, ...otherProps } = props
    if (maybeKey !== undefined) {
        otherProps.key = maybeKey
    }
    return children !== undefined
        ? createElement(type, otherProps, ...children)
        : createElement(type, otherProps)
}

// the jsxs function is called when the children prop is a static array, i.e. when you just provide multiple jsx children:
// <div>
//   <div />
//   <div />
// </div
export function jsxs(
    type: JSXElementType,
    props: HarmajaProps,
    maybeKey?: string
): HarmajaOutput {
    return jsx(type, props, maybeKey)
}
