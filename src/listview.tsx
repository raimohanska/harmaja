import * as Bacon from "baconjs"
import { attachOnUnmount, removeElement, replaceElement, appendElement, attachOnMount } from "./harmaja"
import { Atom } from "./atom"

// TODO: any type below. Figure out! Probably some validation for the renderer results is in order too
export type ListViewProps<A, K = A> = {
    observable: Bacon.Property<A[]>, 
    renderObservable: (key: K, x: Bacon.Property<A>) => any, 
    key: (x: A) => K
} | {
    observable: Bacon.Property<A[]>, 
    renderItem: (x: A) => any,
    key?: (x: A) => K
} | {
    atom: Atom<A[]>, 
    renderAtom: (key: K, x: Atom<A>, remove: () => void) => any, 
    key: (x: A) => K
}
export function ListView<A, K>(props: ListViewProps<A, K>) {
    const observable = ("atom" in props) ? props.atom : props.observable
    const { key = ((x: A): K => x as any) } = props    
    // TODO: would work better if could return multiple elements!
    const rootElement = document.createElement("span")
    let currentValues: A[] | null = null
    
    attachOnMount(rootElement, () => {
        const unsub = observable.forEach(nextValues => {
            if (!currentValues) {
                for (let i = 0; i < nextValues.length; i++) { // <- weird that I need a cast. TS compiler bug?
                    appendElement(rootElement, renderItem(key(nextValues[i]), nextValues, i)) 
                }                
            } else {
                // TODO: different strategy based on count change:
                // newCount==oldCount => replacement strategy (as implemented not)
                // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
                // newCount>oldCount => assume insertion on non-equality
                for (let i = 0; i < nextValues.length; i++) {
                    const nextItemKey = key(nextValues[i])
                    if (i >= rootElement.childNodes.length) {
                        //console.log("Append new element for", nextValues[i])
                        appendElement(rootElement, renderItem(nextItemKey, nextValues, i))
                    } else if (nextItemKey !== key(currentValues[i])) {
                        //console.log("Replace element for", nextValues[i])
                        replaceElement(rootElement.childNodes[i], renderItem(nextItemKey, nextValues, i))                    
                    } else {
                        //console.log("Keep element for", nextValues[i])
                        // Same item, keep existing element
                    }
                }
    
                for (let i = currentValues.length - 1; i >= nextValues.length; i--) {
                    //console.log("Remove element for", currentValues[i])
                    removeElement(rootElement.childNodes[i])
                }
            }
            currentValues = nextValues
        })
    
        attachOnUnmount(rootElement, unsub)    
    })
    
    return rootElement

    function renderItem(key: K, values: A[], index: number) {
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
