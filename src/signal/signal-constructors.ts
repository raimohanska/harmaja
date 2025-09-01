import { SignalLike } from "./signal-types"
import { mapSignal, filter, view } from "./signal-transform"
import type { Signal } from "./signal-types"
import { Observer, Unsubscribe } from "./observer"
import { Lens } from "./lens"

export function createSignal<T>(s: SignalLike<T>): Signal<T> {
    return {
        get: () => s.get(),
        observe: (observer: Observer<void>) => s.observe(observer),
        forEach: (observer: Observer<T>) => s.observe(() => observer(s.get())),
        map<B>(f: (value: T) => B): Signal<B> {
            return mapSignal(this, f)
        },
        view<B>(lens: Lens<T, B>): Signal<B> {
            return view(this, lens)
        },
        filter(predicate: (value: T) => boolean): Signal<T> {
            return filter(this, predicate)
        },
    }
}

export function constantSignal<T>(value: T): Signal<T> {
    return createSignal<T>({
        get() {
            return value
        },
        observe(): Unsubscribe {
            return () => {}
        },
    })
}

export function isSignal(obj: any): obj is Signal<any> {
    return (
        obj &&
        typeof obj.get === "function" &&
        typeof obj.observe === "function"
    )
}
