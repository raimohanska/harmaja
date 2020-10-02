import * as Bacon from "baconjs"
import { LowLevelApi as H, HarmajaOutput, DOMNode, NodeController, debug, HarmajaStaticOutput } from "./harmaja"
import { Atom } from "./atom"

export type ListViewProps<A, K = A> = {
    observable: Bacon.Property<A[]>, 
    renderObservable: (key: K, x: Bacon.Property<A>) => HarmajaOutput, // Actually requires a DOMNode but JSX forces this wider type
    getKey: (x: A) => K
} | {
    observable: Bacon.Property<A[]>, 
    renderItem: (x: A) => HarmajaOutput,
    getKey?: (x: A) => K
} | {
    atom: Atom<A[]>, 
    renderAtom: (key: K, x: Atom<A>, remove: () => void) => HarmajaOutput, 
    getKey: (x: A) => K
}
export function ListView<A, K>(props: ListViewProps<A, K>) {
    const observable: Bacon.Property<A[]> = ("atom" in props) ? props.atom : props.observable
    const { getKey: key = ((x: A): K => x as any) } = props    
    let currentValues: A[] | null = null
    const options = { 
        onReplace: (oldNodes: DOMNode[], newNodes: DOMNode[]) => {
            getSingleNodeOrFail(newNodes) // Verify that a child node is replaced by exactly one child node.
        }
    }

    return H.createController([H.createPlaceholder()], (controller) => observable.forEach((nextValues: A[]) => {
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
                let prevElement = controller.currentElements[0] // i.e. the placeholder element
                for (let i = 0; i < nextValues.length; i++) {
                    const nextItemKey = key(nextValues[i])
                    const newElement = renderItem(nextItemKey, nextValues, i)
                    if (i == 0) {
                        H.replaceNode(controller, i, newElement)        
                    } else {
                        H.addAfterNode(controller, prevElement, newElement)                        
                    }                        
                    prevElement = newElement
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
                    let prevElement = controller.currentElements[controller.currentElements.length - 1]
                    for (let i = currentValues.length; i < nextValues.length; i++) {
                        const nextItemKey = key(nextValues[i])
                        const newElement = renderItem(nextItemKey, nextValues, i)
                        H.addAfterNode(controller, prevElement, newElement)
                        prevElement = newElement                        
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
            const nullableAtom = props.atom.view(index)
            const nonNullableAtom = nullableAtom.freezeUnless(a => a !== undefined) as Atom<A>
            const removeItem = () => nullableAtom.set(undefined)
            return props.renderAtom(key, nonNullableAtom, removeItem)
        }
        if ("renderObservable" in props) {
            return props.renderObservable(key, observable.map(items => items[index]).filter(item => item !== undefined).skipDuplicates())                   
        }
        return props.renderItem(values[index])            
    }
}