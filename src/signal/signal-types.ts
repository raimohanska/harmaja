import { Observer, Unsubscribe } from "./observer"
import { Lens } from "./lens"

export interface SignalLike<T> {
    get(): T
    observe(observer: Observer<void>): Unsubscribe
}

export interface Signal<T> extends SignalLike<T> {
    forEach(observer: Observer<T>): Unsubscribe
    map<B>(f: (value: T) => B): Signal<B>
    view<B>(lens: Lens<T, B>): Signal<B>
    filter<B extends T>(predicate: (value: T) => value is B): Signal<B>
    filter(predicate: (value: T) => boolean): Signal<T>
}
