import { Observer, Unsubscribe } from "./observer"

export type Callback = () => void

type ObserverList<T> = Observer<T>[]

export function Dispatcher<T>() {
    let observers: ObserverList<T> = []
    let dispatching: ObserverList<T> | null = null
    let todos: Callback[] = []
    const removed: Set<Observer<T>> = new Set()

    function dispatch(value: T) {
        if (dispatching) {
            todos.push(() => dispatch(value))
            return
        }
        dispatching = observers
        if (dispatching)
            for (const observer of dispatching) {
                if (removed.has(observer)) {
                    // Skip observers removed during dispatch
                } else {
                    observer(value)
                }
            }
        removed.clear()
        dispatching = null
        const leftOvers = todos
        todos = []
        leftOvers.forEach((f) => f())
    }
    function cloneIfNecessary() {
        if (dispatching === observers) {
            observers = [...observers]
        }
    }
    function remove(observer: Observer<T>) {
        cloneIfNecessary()
        const index = observers.indexOf(observer)
        if (index >= 0) {
            if (dispatching) {
                removed.add(observer)
            }
            observers.splice(index, 1)
            return true
        }
        return false
    }
    function add(observer: Observer<T>) {
        cloneIfNecessary()
        observers.push(observer)
    }

    function count() {
        return observers.length
    }

    return {
        add,
        remove,
        dispatch,
        count,
    }
}
