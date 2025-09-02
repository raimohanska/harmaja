import { Unsubscribe, Observer } from "./observer"
import { createSignal, isSignal } from "./signal-constructors"
import { Signal, SignalLike } from "./signal"
import { item, keyOrLens2Lens, Lens, prop } from "./lens"
import { Dispatcher } from "./dispatcher"

export interface AtomLike<T> extends SignalLike<T> {
    set(value: T): void
}

export interface Atom<T> extends Signal<T> {
    set(value: T): void
    modify(modifier: (current: T) => T): void
    view<B>(lens: Lens<T, B>): Atom<B>
    view<K extends keyof T>(key: K): Atom<T[K]>
    filter<B extends T>(predicate: (value: T) => value is B): Atom<B>
    filter(predicate: (value: T) => boolean): Atom<T>
}

export function Atom<T>(atom: AtomLike<T>): Atom<T> {
    const signal = createSignal<T>(atom)
    return {
        ...atom,
        ...signal,
        view<B>(lensOrKey: unknown): Atom<B> {
            const lens = keyOrLens2Lens(lensOrKey)
            return Atom<B>({
                get() {
                    return lens.get(atom.get())
                },
                set(value) {
                    const root = atom.get()
                    const newRoot = lens.set(root, value)
                    atom.set(newRoot)
                },
                observe(observer) {
                    return atom.observe(observer)
                },
            })
        },
        filter<B extends T>(predicate: (value: T) => value is B): Atom<B> {
            const filteredSignal = signal.filter(predicate)
            return Atom<B>({
                ...filteredSignal,
                set(value) {
                    atom.set(value)
                },
            })
        },
        modify(modifier) {
            this.set(modifier(this.get()))
        },
    }
}

export function atomFromValue<T>(initial: T): Atom<T> {
    let current = initial
    let signal: Signal<T> = createSignal<T>({
        get() {
            return current
        },
        observe(observer: Observer<void>): Unsubscribe {
            dispatcher.add(observer)
            return () => {
                dispatcher.remove(observer)
            }
        },
    })
    const dispatcher = Dispatcher<void>()

    const atomLike: AtomLike<T> = {
        ...signal,
        set(value: T) {
            if (value !== current) {
                current = value
                dispatcher.dispatch()
            }
        },
    }
    return Atom(atomLike)
}

export function atomFromSignalAndSetter<T>(
    signal: SignalLike<T>,
    setter: (value: T) => void
): Atom<T> {
    return Atom<T>({
        ...signal,
        set(value: T) {
            setter(value)
        },
    })
}

export function isAtom<T>(obj: any): obj is Atom<T> {
    return (
        isSignal(obj) &&
        typeof (obj as any).set === "function" &&
        typeof (obj as any).modify === "function"
    )
}
