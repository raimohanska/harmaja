export interface Lens<A, B> {
    get(root: A): B
    set(root: A, newValue: B): A
}

type Observer<T> = (newValue: T) => void
export type Unsubscribe = () => void

interface ForEach<T> {
    forEach(observer: Observer<T>): Unsubscribe
}

export interface SignalLike<T> {
    get(): T
    observe(observer: Observer<void>): Unsubscribe
}

export interface Signal<T> extends SignalLike<T>, ForEach<T> {
    map<B>(f: (value: T) => B): Signal<B>
    cached(): Signal<T>
    mapCached<B>(f: (value: T) => B): Signal<B>
    view<B>(lens: Lens<T, B>): Signal<B>
    filter<B extends T>(predicate: (value: T) => value is B): Signal<B>
    filter(predicate: (value: T) => boolean): Signal<T>
}

const initialValue = {}
type InitialValue = typeof initialValue

export function Signal<T>(s: SignalLike<T>): Signal<T> {
    return {
        get: () => s.get(),
        observe: (observer: Observer<void>) => s.observe(observer),
        forEach: (observer: Observer<T>) => s.observe(() => observer(s.get())),
        map<B>(f: (value: T) => B): Signal<B> {
            const parent = this
            let currentValue: B | InitialValue = initialValue
            return Signal<B>({
                get() {
                    currentValue = f(parent.get())
                    return currentValue
                },
                observe(observer: Observer<void>): Unsubscribe {
                    return parent.observe(() => {
                        const newValue = f(parent.get())
                        if (newValue !== currentValue) {
                            currentValue = newValue
                            observer()
                        }
                    })
                },
            })
        },
        mapCached<B>(f: (value: T) => B): Signal<B> {
            const parent = this
            let currentValue: B | InitialValue = initialValue
            return Signal<B>({
                get() {
                    if (currentValue === initialValue) {
                        currentValue = f(parent.get())
                    }
                    return currentValue as B
                },
                observe(observer: Observer<void>): Unsubscribe {
                    return parent.observe(() => {
                        const newValue = f(parent.get())
                        if (newValue !== currentValue) {
                            currentValue = newValue
                            observer()
                        }
                    })
                },
            })
        },
        cached(): Signal<T> {
            const parent = this
            let currentValue: T | InitialValue = initialValue
            return Signal<T>({
                get() {
                    if (currentValue === initialValue) {
                        currentValue = parent.get()
                    }
                    return currentValue as T
                },
                observe(observer: Observer<void>): Unsubscribe {
                    return parent.observe(() => {
                        const newValue = parent.get()
                        if (newValue !== currentValue) {
                            currentValue = newValue
                            observer()
                        }
                    })
                },
            })
        },
        view<B>(lens: Lens<T, B>): Signal<B> {
            const parent = this
            let currentValue: B | InitialValue = initialValue
            return Signal<B>({
                get() {
                    currentValue = lens.get(parent.get())
                    return currentValue
                },
                observe(observer: Observer<void>): Unsubscribe {
                    return parent.observe(() => {
                        const newValue = lens.get(parent.get())
                        if (newValue !== currentValue) {
                            currentValue = newValue
                            observer()
                        }
                    })
                },
            })
        },
        filter(predicate: (value: T) => boolean): Signal<T> {
            const parent = this
            const current = parent.get()
            if (!predicate(current)) {
                throw new Error(
                    "Invariant violation: initial value does not satisfy the predicate"
                )
            }

            return Signal<T>({
                get() {
                    const v = parent.get()
                    return predicate(v) ? v : current
                },
                observe(observer: Observer<void>): Unsubscribe {
                    return parent.observe(() => {
                        const v = parent.get()
                        if (predicate(v)) {
                            observer()
                        }
                    })
                },
            })
        },
    }
}

export function constantSignal<T>(value: T): Signal<T> {
    return Signal<T>({
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
    const signal = Signal<T>(atom)
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
    let signal: Signal<T> = Signal<T>({
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

export interface EventStream<T> extends ForEach<T> {}

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
