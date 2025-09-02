import { SignalLike } from "./signal"
import {
    mapSignal,
    filterSignal,
    viewSignal,
    cachedSignal,
    debounceSignal,
} from "./signal-transform"
import type { Signal } from "./signal"
import { Observer, Unsubscribe } from "./observer"
import { keyOrLens2Lens, Lens } from "./lens"
import { log } from "./log"
import { atomFromValue } from "./atom"

export function createSignal<T>(s: SignalLike<T>): Signal<T> {
    return {
        get: () => s.get(),
        /**
         * Calls the observer whenever the signal might have changed.
         * Note that the value might not have actually changed, because it's not checked here.
         * Hence, this should be considered a low-level API.
         *
         * @param observer
         * @returns
         */
        observe: s.observe,
        map<B>(f: (value: T) => B): Signal<B> {
            return mapSignal(this, f)
        },
        view<B>(lensOrKey: unknown): Signal<B> {
            const lens = keyOrLens2Lens(lensOrKey)
            return viewSignal(this, lens)
        },
        filter(predicate: (value: T) => boolean): Signal<T> {
            return filterSignal(this, predicate)
        },
        debounce(delayMs) {
            return debounceSignal(this, delayMs)
        },
        log(message) {
            log(this, message)
            return this
        },
        /**
         * Calls the observer immediately, as well as when the signal value changes, with the new value as argument.
         * Changes are currently defined based on reference equality (===).
         *
         * @param observer
         * @returns
         */
        forEach(observer: Observer<T>): Unsubscribe {
            return cachedSignal(this).observe(() => observer(s.get()))
        },
        /**
         * Calls the observer when the signal value changes, with the new value as argument.
         * Changes are currently defined based on reference equality (===).
         *
         * @param observer
         * @returns
         */
        onChange(observer: Observer<T>): Unsubscribe {
            return cachedSignal(this).observe(() => observer(this.get()))
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

export type PromiseState<T> =
    | { state: "pending" }
    | { state: "resolved"; value: T }
    | { state: "rejected"; error: any }

export function signalFromPromise<T>(
    promise: Promise<T>
): Signal<PromiseState<T>> {
    const state = atomFromValue<PromiseState<T>>({ state: "pending" })
    promise
        .then((value) => {
            state.set({ state: "resolved", value })
        })
        .catch((error) => {
            state.set({ state: "rejected", error })
        })
    return state
}

export function isSignal(obj: any): obj is Signal<any> {
    return (
        obj &&
        typeof obj.get === "function" &&
        typeof obj.observe === "function"
    )
}
