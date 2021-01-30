import * as O from "./observable/observables"
import { DOMNode, HarmajaOutput, HarmajaStaticOutput, LowLevelApi as H, NodeController } from "./harmaja"


// Find starting from hint
function findIndex<A>(xs: A[], test: (value: A) => boolean, hint: number): number {
    const len = xs.length
    let u = hint
    if (u >= len) u = len - 1
    if (u < 0) u = 0
    let d = u - 1
    for (; 0 <= d && u < len; ++u, --d) {
        if (test(xs[u])) return u
        if (test(xs[d])) return d
    }
    for (; u < len; ++u) {
        if (test(xs[u])) return u
    }
    for (; 0 <= d; --d) {
        if (test(xs[d])) return d
    }

    // Not found
    return -1
}

function findKey<A, K>(getKey: (value: A) => K, expected: K): O.Lens<A[], A | undefined> {
    const test = (x: A) => getKey(x) === expected

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
    const { getKey = defaultKey } = props    
    const scope = O.createScope()
    const itemRenderer = getItemRenderer(props, getKey, scope)

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
    }    
    
    return H.createController([currentItems], controller => {
        scope.start()    
        const unsub = O.forEach(observable, (values: A[]) => handleValues(controller, values))
        return () => {
            unsub()
            scope.end()
        }
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
        const result = itemRenderer(key, values, index)
        let rendered = H.render(result)        
        return getSingleNodeOrFail(rendered)
    }
}

type RenderItem<A, K> = (key: K, values: A[], index: number) => HarmajaOutput

function getItemRenderer<A, K>(props: ListViewProps<A, K>, getKey: (a: A) => K, scope: O.Scope): RenderItem<A, K> {
    if ("renderAtom" in props) {
        return (k, values, index) => {
            const lens = findKey(getKey, k)
            const nullableAtom = O.view(props.atom as O.Atom<A[]>, lens as any) // cast to ensure non-usage of native methods
            const nonNullableAtom = O.filter(nullableAtom, a => a !== undefined, scope) as O.Atom<A>
            const removeItem = () => O.set(nullableAtom, undefined)
            return props.renderAtom(k, nonNullableAtom as O.NativeAtom<A>, removeItem)
        }
    } else if ("renderObservable" in props) {
        return (k, values, index) => {
            const lens = findKey(getKey, k)
            const mapped = O.view(props.observable as O.Property<A[]>, lens as any) // cast to ensure non-usage of native methods
            const filtered = O.filter(mapped, item => item !== undefined, scope) as O.Property<A>
            return props.renderObservable(k, filtered as O.NativeProperty<A>)            
        }
    } else {
        const renderObservable = (key: K, x: O.NativeProperty<A>): HarmajaOutput => {
            return O.view(x, props.renderItem)
        }
        return getItemRenderer({ ...props, renderObservable }, getKey, scope)
    }
}

function defaultKey<A, K>(a: A): K {
    return a as any
}