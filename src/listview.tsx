import * as O from "./observable/observables"
import { DOMNode, HarmajaOutput, HarmajaStaticOutput, LowLevelApi as H } from "./harmaja"

export type ListViewProps<A, K = A> = {
    observable: O.NativeProperty<A[]>, 
    renderObservable: (key: K, x: O.NativeProperty<A>) => HarmajaOutput, // Actually requires a DOMNode but JSX forces this wider type
    getKey: (x: A) => K
} | {
    observable: O.NativeProperty<A[]>, 
    renderItem: (x: A) => HarmajaOutput,
    getKey?: (x: A) => K
} | {
    atom: O.NativeAtom<A[]>, 
    renderAtom: (key: K, x: O.NativeAtom<A>, remove: () => void) => HarmajaOutput, 
    getKey: (x: A) => K
}
export function ListView<A, K>(props: ListViewProps<A, K>) {
    const observable: O.Property<A[]> = ("atom" in props) ? props.atom : props.observable
    const { getKey: key = ((x: A): K => x as any) } = props    
    let currentValues: A[] | null = null
    const options = { 
        onReplace: (oldNodes: DOMNode[], newNodes: DOMNode[]) => {
            getSingleNodeOrFail(newNodes) // Verify that a child node is replaced by exactly one child node.
        }
    }

    return H.createController([H.createPlaceholder()], (controller) => O.forEach(observable, (nextValues: A[]) => {
        if (!currentValues) {
            if (nextValues.length) {
                const oldElements = controller.currentElements
                let nextElements = nextValues.map((x, i) => renderItem(key(x), nextValues, i)).flatMap(H.toDOMNodes)            
                
                H.replaceMany(controller, oldElements, nextElements)
            }
        } else {
            // Optization idea: different strategy based on count change:
            // newCount==oldCount => replacement strategy (as implemented now)
            // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
            // newCount>oldCount => assume insertion on non-equality                
            if (nextValues.length === 0) {
                let nextElements = [H.createPlaceholder()]
                const oldElements = controller.currentElements
                
                H.replaceMany(controller, oldElements, nextElements)
            } else if (currentValues.length === 0) {         
                for (let i = 0; i < nextValues.length; i++) {
                    const nextItemKey = key(nextValues[i])
                    const newElement = renderItem(nextItemKey, nextValues, i)
                    if (i == 0) {
                        H.replaceNode(controller, i, newElement)        
                    } else {
                        H.addAfterNode(controller, controller.currentElements[i - 1], newElement)                        
                    }                        
                }

            } else {
                // 1. replace at common indices
                for (let i = 0; i < nextValues.length && i < currentValues.length; i++) {
                    const nextItemKey = key(nextValues[i])
                    if (nextItemKey !== key(currentValues[i])) {
                        //console.log("Replace element for", nextValues[i])
                        const nextElement = renderItem(nextItemKey, nextValues, i)
                        H.replaceNode(controller, i, nextElement)                        
                    } else {
                        // Key match => no need to replace
                    }
                }
                // 2. add/remove nodes
                if (nextValues.length > currentValues.length) {                    
                    for (let i = currentValues.length; i < nextValues.length; i++) {
                        const nextItemKey = key(nextValues[i])
                        const newElement = renderItem(nextItemKey, nextValues, i)
                        H.addAfterNode(controller, controller.currentElements[i - 1], newElement)
                    }
                } else if (nextValues.length < currentValues.length) {
                    for (let i = currentValues.length - 1; i >= nextValues.length; i--) {
                        H.removeNode(controller, i, controller.currentElements[i])
                    }                    
                }
            }
        } 
        currentValues = nextValues        
    }), options)
    
    function getSingleNodeOrFail(rendered: HarmajaStaticOutput) {
        if (rendered instanceof Array) {
            if (rendered.length == 1) {
                rendered = rendered[0]
            } else {
                throw Error(`Only single-element results supported in ListView. Got ${rendered}`)
            }
        }
        return rendered
    }
    function renderItem(key: K, values: A[], index: number): ChildNode {
        const result = renderItemRaw(key, values, index)
        let rendered = H.render(result)        
        return getSingleNodeOrFail(rendered)
    }
    function renderItemRaw(key: K, values: A[], index: number) {
        if ("renderAtom" in props) {
            const nullableAtom = O.view(props.atom as O.Atom<A[]>, index) // cast to ensure non-usage of native methods
            const nonNullableAtom = O.filter(nullableAtom, a => a !== undefined) as O.Atom<A>
            const removeItem = () => O.set(nullableAtom, undefined)
            return props.renderAtom(key, nonNullableAtom as O.NativeAtom<A>, removeItem)
        }
        if ("renderObservable" in props) {
            const mapped = O.view(observable as O.Property<A[]>, index) // cast to ensure non-usage of native methods
            const filtered = O.filter(mapped, item => item !== undefined) as O.Property<A>
            return props.renderObservable(key, filtered as O.NativeProperty<A>)                   
        }
        return props.renderItem(values[index])            
    }
}