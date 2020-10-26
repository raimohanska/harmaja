import { Lens } from "lonna"
import * as O from "./observable/observables"
import { DOMNode, HarmajaOutput, HarmajaStaticOutput, LowLevelApi as H } from "./harmaja"

function findKey<A, K>(getKey: (value: A) => K, expected: K): Lens<A[], A | undefined> {
    let index: number = -1
    return {
        get(root) {
            index = root.findIndex(elem => getKey(elem) === expected)
            return index >= 0 ? root[index] : undefined
        },
        set(root, value) {
            // This peculiar lens ignores undefined
            if (value === undefined) return root
            index = root.findIndex(elem => getKey(elem) === expected)
            return index !== -1
                ? [...root.slice(0, index), value, ...root.slice(index + 1)]
                : root

        }
    }
}

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
    const options = {
        onReplace: (oldNodes: DOMNode[], newNodes: DOMNode[]) => {
            if (!Array.isArray(currentItems)) {
                // No children
                throw new Error("Child node replace without having any children!")
            }
            const oldNode = getSingleNodeOrFail(oldNodes)
            const newNode = getSingleNodeOrFail(newNodes)

            let found = false
            key2item.forEach(item => {
                if (item.node === oldNode) {
                    item.node = newNode
                    found = true
                }
            })
            if (!found) {
                throw new Error('Could not find a child node to replace!')
            }
        }
    }

    interface Item {
        key: K
        node: ChildNode
        index: number
    }

    const key2item = new Map<K, Item>()

    // If the list is empty, we render a placeholder. It doesn't have a key.
    let currentItems: Text | Item[] = H.createPlaceholder()

    return H.createController([currentItems], controller => O.forEach(observable, (nextValues: A[]) => {
        const currN = Array.isArray(currentItems) ? currentItems.length : 0
        const nextN = nextValues.length

        if (currN === 0 && nextN === 0) {
            // Nothing to do
            return
        }

        let result = nextN === currN && Array.isArray(currentItems) ? currentItems : Array<Item>(nextN)
        const createdNodes: ChildNode[] = []
        const deletedNodes: ChildNode[] = []

        const nextKeys = nextValues.map(key)

        for (let i = 0; i < nextN; ++i) {
            const k = nextKeys[i]
            let item = key2item.get(k)
            if (item === undefined) {
                const node = renderItem(k, nextValues, i)
                createdNodes.push(node)
                item = { key: k, node, index: i }
                key2item.set(k, item)
            }
            if (!result[i] || result[i].key !== item.key) {
                item.index = i
                if (result === currentItems) {
                    // Copy on write
                    result = currentItems.slice(0)
                }
                result[i] = item
            }
        }
        if (result !== currentItems) {
            key2item.forEach((info) => {
                const i = info.index
                if (!result[i] || result[info.index].key !== info.key) {
                    deletedNodes.push(info.node)
                    key2item.delete(info.key)
                }
            })

            const oldNodes = Array.isArray(currentItems)
                ? currentItems.map(item => item.node)
                : [currentItems]  // <-- placeholder
            if (nextN > 0) {
                const newNodes = result.map(item => item.node)
                currentItems = result
                H.replaceAllInPlace(controller, oldNodes, newNodes, createdNodes, deletedNodes)
            } else {
                const newNodes = [H.createPlaceholder()]
                currentItems = newNodes[0]
                H.replaceAllInPlace(controller, oldNodes, newNodes, newNodes, deletedNodes)
            }
        }
    }), options)
    
    function getSingleNodeOrFail(rendered: HarmajaStaticOutput): ChildNode {
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
    function renderItemRaw(k: K, values: A[], index: number) {
        if ("renderAtom" in props) {
            const lens = findKey(key, k)
            const nullableAtom = O.view(props.atom as O.Atom<A[]>, lens as any) // cast to ensure non-usage of native methods
            const nonNullableAtom = O.filter(nullableAtom, a => a !== undefined) as O.Atom<A>
            const removeItem = () => O.set(nullableAtom, undefined)
            return props.renderAtom(k, nonNullableAtom as O.NativeAtom<A>, removeItem)
        }
        if ("renderObservable" in props) {
            const lens = findKey(key, k)
            const mapped = O.view(observable as O.Property<A[]>, lens as any) // cast to ensure non-usage of native methods
            const filtered = O.filter(mapped, item => item !== undefined) as O.Property<A>
            return props.renderObservable(k, filtered as O.NativeProperty<A>)
        }
        return props.renderItem(values[index])            
    }
}
