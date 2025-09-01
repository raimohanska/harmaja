import { createSignal } from "./signal-constructors"
import type { Signal } from "./signal-types"
import { Observer, Unsubscribe } from "./observer"
import { Lens } from "./lens"

const initialValue = {}
type InitialValue = typeof initialValue

export function cached<T>(s: Signal<T>): Signal<T> {
    let currentValue: T | InitialValue = initialValue
    return createSignal<T>({
        get() {
            if (currentValue === initialValue) {
                currentValue = s.get()
            }
            return currentValue as T
        },
        observe(observer: Observer<void>): Unsubscribe {
            return s.observe(() => {
                const newValue = s.get()
                if (newValue !== currentValue) {
                    currentValue = newValue
                    observer()
                }
            })
        },
    })
}

export function mapCached<T, B>(s: Signal<T>, f: (value: T) => B): Signal<B> {
    let currentValue: B | InitialValue = initialValue
    return createSignal<B>({
        get() {
            if (currentValue === initialValue) {
                currentValue = f(s.get())
            }
            return currentValue as B
        },
        observe(observer: Observer<void>): Unsubscribe {
            return s.observe(() => {
                const newValue = f(s.get())
                if (newValue !== currentValue) {
                    currentValue = newValue
                    observer()
                }
            })
        },
    })
}

export function view<A, B>(s: Signal<A>, lens: Lens<A, B>): Signal<B> {
    let currentValue: B | InitialValue = initialValue
    return createSignal<B>({
        get() {
            currentValue = lens.get(s.get())
            return currentValue
        },
        observe(observer: Observer<void>): Unsubscribe {
            return s.observe(() => {
                const newValue = lens.get(s.get())
                if (newValue !== currentValue) {
                    currentValue = newValue
                    observer()
                }
            })
        },
    })
}

export function filter<T>(
    s: Signal<T>,
    predicate: (value: T) => boolean
): Signal<T> {
    const current = s.get()
    if (!predicate(current)) {
        throw new Error(
            "Invariant violation: initial value does not satisfy the predicate"
        )
    }

    return createSignal<T>({
        get() {
            const v = s.get()
            return predicate(v) ? v : current
        },
        observe(observer: Observer<void>): Unsubscribe {
            return s.observe(() => {
                const v = s.get()
                if (predicate(v)) {
                    observer()
                }
            })
        },
    })
}

export function mapSignal<T, B>(s: Signal<T>, f: (value: T) => B): Signal<B> {
    let currentValue: B | InitialValue = initialValue
    return createSignal<B>({
        get() {
            currentValue = f(s.get())
            return currentValue
        },
        observe(observer: Observer<void>): Unsubscribe {
            return s.observe(() => {
                const newValue = f(s.get())
                if (newValue !== currentValue) {
                    currentValue = newValue
                    observer()
                }
            })
        },
    })
}
