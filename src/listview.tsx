import * as Bacon from "baconjs"
import { attachUnsub, removeElement, replaceElement } from "./harmaja"
import { Atom } from "./atom"

// TODO: any type below. Figure out! Probably some validation for the renderer results is in order too
export type ListViewProps<A> = {
    observable: Bacon.Property<A[]>, 
    renderObservable: (x: Bacon.Property<A>) => any, 
    equals: (x: A, y: A) => boolean
} | {
    observable: Bacon.Property<A[]>, 
    renderItem: (x: A) => any, 
    equals?: (x: A, y: A) => boolean
} | {
    atom: Atom<A[]>, 
    renderAtom: (x: Atom<A>, remove: () => void) => any, 
    equals: (x: A, y: A) => boolean
}
export function ListView<A>(props: ListViewProps<A>) {
    const observable = ("atom" in props) ? props.atom : props.observable
    const { equals = (a, b) => a === b } = props    
    // TODO: would work better if could return multiple elements!
    const rootElement = document.createElement("span")
    let currentValues: A[] | null = null
    
    const unsub = observable.forEach(nextValues => {
        if (!currentValues) {
            for (let i = 0; i < nextValues.length; i++) { // <- weird that I need a cast. TS compiler bug?
                rootElement.appendChild(itemToNode(nextValues, i))
            }                
        } else {
            // TODO: different strategy based on count change:
            // newCount==oldCount => replacement strategy (as implemented not)
            // newCount<oldCOunt => assume removal on non-equality (needs smarter item observable mapping that current index-based one though)
            // newCount>oldCount => assume insertion on non-equality
            for (let i = 0; i < nextValues.length; i++) {
                if (i >= rootElement.childNodes.length) {
                    //console.log("Append new element for", nextValues[i])
                    rootElement.appendChild(itemToNode(nextValues, i))
                } else if (!equals(nextValues[i], currentValues[i])) {
                    //console.log("Replace element for", nextValues[i])
                    replaceElement(rootElement.childNodes[i], itemToNode(nextValues, i))                    
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

    attachUnsub(rootElement, unsub)
    
    return rootElement

    function itemToNode(values: A[], index: number) {
        return renderItem(values, index)            
    }

    function renderItem(values: A[], index: number) {
        if ("renderAtom" in props) {
            const nullableAtom = props.atom.view(index)
            const nonNullableAtom = nullableAtom.freezeUnless(a => a !== undefined) as Atom<A>
            const removeItem = () => nullableAtom.set(undefined)
            return props.renderAtom(nonNullableAtom, removeItem)
        }
        if ("renderObservable" in props) {
            return props.renderObservable(observable.map(items => items[index]).filter(item => item !== undefined).skipDuplicates())                   
        }
        return props.renderItem(values[index])            
    }
}
