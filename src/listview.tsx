import { DOMNode, HarmajaOutput, HarmajaStaticOutput, LowLevelApi as H, NodeController } from "./harmaja"
import { Atom, cachedSignal, Lens, Signal, mapSignal } from "./signal"


// Find starting from hint
function findIndex<A>(xs: A[], test: (value: A, index: number) => boolean, hint: number): number {
    const len = xs.length
    let u = hint
    if (u >= len) u = len - 1
    if (u < 0) u = 0
    let d = u - 1
    for (; 0 <= d && u < len; ++u, --d) {
        if (test(xs[u], u)) return u
        if (test(xs[d], d)) return d
    }
    for (; u < len; ++u) {
        if (test(xs[u], u)) return u
    }
    for (; 0 <= d; --d) {
        if (test(xs[d], d)) return d
    }

    // Not found
    return -1
}

function findKeyLens<A, K>(getKey: (value: A, index: number) => K, expected: K): Lens<A[], A | undefined> {
    const test = (x: A, index: number) => getKey(x, index) === expected

    // Cache the previous index. When items are moved they tend to end up near
    // the previous index, it makes the search faster to start from the previous
    // index and move down and up from there.
    let index: number = -1

    return {
        get(root) {
            index = findIndex(root, test, index)
            return index >= 0 ? root[index] : undefined
        },
        set(root, value) {
            index = findIndex(root, test, index)
            if (index === -1) return root
            if (value === undefined) {
                // This peculiar lens deletes the item when undefined is written
                const result = root.slice(0)
                result.splice(index, 1)
                return result
            }
            return [...root.slice(0, index), value, ...root.slice(index + 1)]
        }
    }
}

export type ListViewProps<A, K = A> = {
    observable: Signal<A[]>, 
    renderObservable: (key: K, x: Signal<A>) => HarmajaOutput, // Actually requires a DOMNode but JSX forces this wider type
    getKey: (x: A, index: number) => K
} | {
    observable: Signal<A[]>, 
    renderItem: (x: A) => HarmajaOutput,
    getKey?: (x: A, index: number) => K
} | {
    atom: Atom<A[]>, 
    renderAtom: (key: K, x: Signal<A>, remove: () => void) => HarmajaOutput, 
    getKey: (x: A, index: number) => K
}
export function ListView<A, K>(props: ListViewProps<A, K>) {
    const observable: Signal<A[]> = ("atom" in props) ? props.atom : props.observable
    const { getKey = defaultKey } = props    
    const itemRenderer = getItemRenderer(props, getKey)

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
    // TODO: Could currentItems be just Text | K[] ???
    let currentItems: Text | Item[] = H.createPlaceholder()

    const handleValues = (controller: NodeController, nextValues: A[]) => {
        const currN = Array.isArray(currentItems) ? currentItems.length : 0
        const nextN = nextValues.length

        if (currN === 0 && nextN === 0) {
            // Nothing to do
            return
        }

        // Reuse currentItems array if lengths match, copy on write when necessary below
        let result = nextN === currN && Array.isArray(currentItems) ? currentItems : Array<Item>(nextN)
        const createdNodes: ChildNode[] = []
        const deletedNodes: ChildNode[] = []

        if (!Array.isArray(currentItems)) {
            // Placeholder is going to be deleted
            deletedNodes.push(currentItems)
        }

        const nextKeys = nextValues.map(getKey)

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
        if (result !== currentItems) { // Something changed
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
            } else { // Result is empty, use placeholder
                const placeholder = H.createPlaceholder()
                const newNodes = [placeholder]
                currentItems = newNodes[0]
                H.replaceAllInPlace(controller, oldNodes, newNodes, newNodes, deletedNodes)
            }
        }
    }

    const initialValues = observable.get()
    const initialDOMNodes: DOMNode[] = []

    if (initialValues.length > 0) {
        const initialItems: Item[] = []
        initialValues.forEach((v, i) => {
            const k = getKey(v, i)
            const node = renderItem(k, initialValues, i)
            const item = { key: k, node, index: i }
            initialItems.push(item)
            key2item.set(k, item)
            initialDOMNodes.push(node)
        })
        currentItems = initialItems
    } else {
        const placeholder = H.createPlaceholder()
        currentItems = placeholder
        initialDOMNodes.push(placeholder)
    }
    
    return H.createController(initialDOMNodes, controller => {
        const unsub = observable.observe(() => handleValues(controller, observable.get()))
        return unsub
    }, options)
    
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
        const result = itemRenderer(key)
        let rendered = H.render(result)        
        return getSingleNodeOrFail(rendered)
    }
}

type RenderItem<A, K> = (key: K) => HarmajaOutput

function getItemRenderer<A, K>(props: ListViewProps<A, K>, getKey: (a: A, index: number) => K): RenderItem<A, K> {
    if ("renderAtom" in props) {
        return (k) => {
            const lens = findKeyLens(getKey, k)
            const nullableAtom = props.atom.view(lens)
            const removeItem = () => nullableAtom.set(undefined)
            return props.renderAtom(k, nullableAtom.filter(notNull), removeItem)
        }
    } else if ("renderObservable" in props) {
        return (k) => {
            const lens = findKeyLens(getKey, k)
            const mapped = props.observable.view(lens)
            return props.renderObservable(k, mapped.filter(notNull))            
        }
    } else {
        const renderObservable = (key: K, x: Signal<A>): HarmajaOutput => {
            return cachedSignal(x).map(props.renderItem)
        }
        return getItemRenderer({ ...props, renderObservable }, getKey)
    }
}

function defaultKey<A, K>(a: A): K {
    return a as any
}

function notNull<T>(x: T | null | undefined): x is T {
    return x !== null && x !== undefined
}