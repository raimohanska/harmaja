import * as Bacon from "baconjs"
import { attachUnsub, removeElement, replaceElement } from "./harmaja"
import { Atom } from "./atom"
import { reportValueMissing } from "./utilities"

// TODO: any type below. How to refer to the JSX.Element type?
export type ListViewProps<A> = {
    observable: Bacon.Property<A[]>, 
    renderObservable: (x: Bacon.Property<A>) => any, 
    equals: (x: A, y: A) => boolean
} | {
    observable: Bacon.Property<A[]>, 
    renderItem: (x: A) => any, 
    equals: (x: A, y: A) => boolean
} | {
    atom: Atom<A[]>, 
    renderAtom: (x: Atom<A>, remove: () => void) => any, 
    equals: (x: A, y: A) => boolean
}
export function ListView<A>(props: ListViewProps<A>) {
    const observable = ("atom" in props) ? props.atom : props.observable
    const { equals } = props    
    // TODO: would work better if could return multiple elements!
    const rootElement = document.createElement("span")
    let currentValues: A[] | null = null
    
    const unsub = observable.subscribeInternal(event => {
        if (!Bacon.hasValue(event)) return
        const nextValues = event.value
        if (currentValues) {
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
                console.log("Remove element for", currentValues[i])
                removeElement(rootElement.childNodes[i])
            }
        }
        currentValues = nextValues
    })

    console.log(currentValues)

    if (!currentValues) {
        unsub()
        reportValueMissing(observable)
    }

    for (let i = 0; i < (currentValues as any).length; i++) { // <- weird that I need a cast. TS compiler bug?
        rootElement.appendChild(itemToNode(currentValues as any, i))
    }

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
