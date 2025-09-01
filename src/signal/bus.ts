import { Observer, Unsubscribe } from "./observer"

export interface EventStream<T> {
    forEach(observer: Observer<T>): Unsubscribe
}

export interface Bus<T> extends EventStream<T> {
    push(value: T): void
}

export function Bus<T>(): Bus<T> {
    let observers: Observer<T>[] = []
    const stream: Bus<T> = {
        forEach(observer: Observer<T>): Unsubscribe {
            observers.push(observer)
            return () => {
                observers = observers.filter((o) => o !== observer)
            }
        },
        push(value: T) {
            observers.forEach((o) => o(value))
        },
    }
    return stream
}
