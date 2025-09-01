import { Unsubscribe, Observer } from "./observer"
import { createSignal, isSignal } from "./signal-constructors"
import { Signal, SignalLike } from "./signal-types"
import { Lens } from "./lens"

export interface AtomLike<T> extends SignalLike<T> {
    set(value: T): void
}

export interface Atom<T> extends Signal<T> {
    set(value: T): void
    modify(modifier: (current: T) => T): void
    view<B>(lens: Lens<T, B>): Atom<B>
    filter<B extends T>(predicate: (value: T) => value is B): Atom<B>
    filter(predicate: (value: T) => boolean): Atom<T>
}

export function Atom<T>(atom: AtomLike<T>): Atom<T> {
    const signal = createSignal<T>(atom)
    return {
        ...atom,
        ...signal,
        view<B>(lens: Lens<T, B>): Atom<B> {
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
            observers.push(observer)
            return () => {
                observers = observers.filter((o) => o !== observer)
            }
        },
    })
    let observers: Observer<void>[] = []
    const atomLike: AtomLike<T> = {
        ...signal,
        set(value: T) {
            if (value !== current) {
                current = value
                observers.forEach((o) => o())
            }
        },
    }
    return Atom(atomLike)
}

export function isAtom<T>(obj: any): obj is Atom<T> {
    return (
        isSignal(obj) &&
        typeof (obj as any).set === "function" &&
        typeof (obj as any).modify === "function"
    )
}
