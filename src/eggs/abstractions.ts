export type Observer<V> = (value: V) => void

export interface Observable<V, E extends string> {
    on(event: E, observer: Observer<V>): void;
}

export interface Property<V> extends Observable<V, PropertyEventType> {
    get(): V
}

export type PropertyEventType = "value" | "change"

export interface Atom<V> extends Property<V> {
    set(newValue: V): void
    modify(fn: (old: V) => V): void
}
