export interface Lens<A, B> {
    get(root: A): B
    set(root: A, newValue: B): A
}
