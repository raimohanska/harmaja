import { applyScope } from "./applyscope"
import { EventStream, EventStreamSeed } from "./eggs"
import { Scope } from "./scope"

export function later<V>(delay: number, value: V, scope: Scope): EventStream<V>
export function later<V>(delay: number, value: V): EventStreamSeed<V>
export function later<V>(delay: number, value: V, scope?: Scope): any {
    const seed = new EventStreamSeed(`interval(${delay}, ${value})`, (observer) => {
        const timeout = setTimeout(() => observer(value), delay)
        return () => clearTimeout(timeout)
    })
    if (scope !== undefined) {
        return applyScope(scope, seed)
    }
    return seed
}