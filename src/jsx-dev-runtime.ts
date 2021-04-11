import { JSXElementType, HarmajaProps, HarmajaOutput } from "./harmaja"
import { jsx } from "./jsx-runtime"

export { Fragment } from "./harmaja"

// This is the jsx entrypoint when using the development mode transform, i.e. `react-jsxdev` in tsconfig
export function jsxDEV(
    type: JSXElementType,
    props: HarmajaProps,
    maybeKey?: string,
    isStaticChildren?: boolean,
    source?: string,
    self?: string
): HarmajaOutput {
    return jsx(type, props, maybeKey)
}
