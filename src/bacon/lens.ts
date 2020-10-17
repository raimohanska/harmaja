export interface Lens<A, B> {
    get(root: A): B
    set(root: A, newValue: B): A
}

export function prop<A, K extends keyof A>(key: K): Lens<A, A[K]> {
    return {
        get: (root: A) => (root as any)[key],
        set: (root: A, newValue: any) => ({ ...root, [key]: newValue})
    }
}

export function item<I>(index: number): Lens<I[], I | undefined> {
    return {
        get: (root: I[]) => (root as any)[index],
        set: (nums: I[], newValue: I | undefined) => newValue === undefined  
            ? [...nums.slice(0, index), ...nums.slice(index+1)]
            : [...nums.slice(0, index), newValue, ...nums.slice(index+1)]
    }
}