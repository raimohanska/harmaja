import * as Bacon from "baconjs"
import { LowLevelApi as H, HarmajaOutput, DOMElement, NodeController, debug } from "./harmaja"
import { Atom } from "./atom"

export type ListViewProps<A, K = A> = {
    observable: Bacon.Property<A[]>, 
    renderObservable: (key: K, x: Bacon.Property<A>) => HarmajaOutput, 
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
    const observable = ("atom" in props) ? props.atom : props.observable
    const { getKey: key = ((x: A): K => x as any) } = props    
    let currentValues: A[] | null = null
    const controller: NodeController = {
        currentElements: [H.createPlaceholder()] as ChildNode[]
    }

    H.attachController(controller, () => observable.forEach((nextValues: A[]) => {
        H.detachController(controller.currentElements, controller)
        if (!currentValues) {
            if (nextValues.length) {
                let nextElements = nextValues.map((x, i) => renderItem(key(x), nextValues, i)).flatMap(H.toDOMElements)            
                H.replaceMany(controller.currentElements, nextElements)
                controller.currentElements = nextElements
            }
        } else {
            // Optization idea: different strategy based on count change:
            // newCount==oldCount => replacement strategy (as implemented now)
            // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
            // newCount>oldCount => assume insertion on non-equality                
            if (nextValues.length === 0) {
                let nextElements = [H.createPlaceholder()]
                H.replaceMany(controller.currentElements, nextElements)
                controller.currentElements = nextElements
            } else if (currentValues.length === 0) {
                let prevElement = controller.currentElements[0] // i.e. the placeholder element
                for (let i = 0; i < nextValues.length; i++) {
                    const nextItemKey = key(nextValues[i])
                    const newElement = renderItem(nextItemKey, nextValues, i)
                    if (i == 0) {
                        H.replaceElement(prevElement, newElement)
                        controller.currentElements[i] = newElement           
                    } else {
                        H.addAfterElement(prevElement, newElement)
                        controller.currentElements.push(newElement)
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
                        H.replaceElement(controller.currentElements[i], nextElement)
                        controller.currentElements[i] = nextElement           
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
                        H.addAfterElement(prevElement, newElement)
                        prevElement = newElement
                        controller.currentElements.push(newElement)
                    }
                } else if (nextValues.length < currentValues.length) {
                    for (let i = nextValues.length; i < currentValues.length; i++) {
                        H.removeElement(controller.currentElements[i])
                    }
                    controller.currentElements.splice(nextValues.length)
                }
            }
        } 
        currentValues = nextValues
        H.attachController(controller)
    }))
    
    return controller.currentElements

    function renderItem(key: K, values: A[], index: number) {
        const result = renderItemRaw(key, values, index)
        if (!(result instanceof Node)) {
            throw Error("Unexpected result from renderItem: " + result)
        }
        return result
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