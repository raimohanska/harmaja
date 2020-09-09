import * as Bacon from "baconjs"
import { LowLevelApi as H, HarmajaOutput, DOMElement } from "./harmaja"
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
    // TODO: would work better if could return multiple elements!
    let currentElements: ChildNode[] = [H.createPlaceholder()]
    let currentValues: A[] | null = null
    
    H.attachOnMount(currentElements[0], () => {
        const unsub = observable.forEach((nextValues: A[]) => {
            const unmounts = H.detachOnUnmounts(currentElements[0])
            if (!currentValues) {
                if (nextValues.length) {
                    let nextElements = nextValues.map((x, i) => renderItem(key(x), nextValues, i)).flatMap(H.toDOMElements)            
                    H.replaceMany(currentElements, nextElements)
                    currentElements = nextElements
                }
            } else {
                // Optization idea: different strategy based on count change:
                // newCount==oldCount => replacement strategy (as implemented now)
                // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
                // newCount>oldCount => assume insertion on non-equality                
                if (nextValues.length === 0) {
                    let nextElements = [H.createPlaceholder()] // TODO: switch unsub
                    H.replaceMany(currentElements, nextElements)
                    currentElements = nextElements
                } else if (currentValues.length === 0) {
                    let prevElement = currentElements[0] // i.e. the placeholder element
                    for (let i = 0; i < nextValues.length; i++) {
                        const nextItemKey = key(nextValues[i])
                        const newElement = renderItem(nextItemKey, nextValues, i)
                        if (i == 0) {
                            H.replaceElement(prevElement, newElement)
                            currentElements[i] = newElement           
                        } else {
                            H.addAfterElement(prevElement, newElement)
                            currentElements.push(newElement)
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
                            H.replaceElement(currentElements[i], nextElement)
                            currentElements[i] = nextElement           
                        } else {
                            // Key match => no need to replace
                        }
                    }
                    // 2. add/remove nodes
                    if (nextValues.length > currentValues.length) {
                        let prevElement = currentElements[currentElements.length - 1]
                        for (let i = currentValues.length; i < nextValues.length; i++) {
                            const nextItemKey = key(nextValues[i])
                            const newElement = renderItem(nextItemKey, nextValues, i)
                            H.addAfterElement(prevElement, newElement)
                            prevElement = newElement
                            currentElements.push(newElement)
                        }
                    } else if (nextValues.length < currentValues.length) {
                        for (let i = nextValues.length; i < currentValues.length; i++) {
                            H.removeElement(currentElements[i])
                        }
                        currentElements.splice(nextValues.length)
                    }
                }
            } 
            currentValues = nextValues
            for (const unmount of unmounts) {
                H.attachOnUnmount(currentElements[0], unmount)
            }                
        })
        H.attachOnUnmount(currentElements[0], unsub)    
    })
    
    return currentElements

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
