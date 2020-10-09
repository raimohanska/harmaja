import { applyScope } from "./applyscope"
import { EventStream, EventStreamSeed } from "./eggs"
import { Scope } from "./scope"

export function interval<V>(delay: number, value: V, scope: Scope): EventStream<V>
export function interval<V>(delay: number, value: V): EventStreamSeed<V>
export function interval<V>(delay: number, value: V, scope?: Scope): any {
    const seed = new EventStreamSeed(`interval(${delay}, ${value})`, (observer) => {
        const interval = setInterval(() => observer(value), delay)
        return () => clearInterval(interval)
    })
    if (scope !== undefined) {
        return applyScope(scope, seed)
    }
    return seed
}