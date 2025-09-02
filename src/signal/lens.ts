export interface Lens<A, B> {
    get(root: A): B
    set(root: A, newValue: B): A
}

export function prop<A, K extends keyof A>(key: K): Lens<A, A[K]> {
    return {
        get: (root: A) => (root as any)[key],
        set: (root: A, newValue: any) => ({ ...root, [key]: newValue }),
    }
}

export function item<I>(index: number): Lens<I[], I | undefined> {
    return {
        get: (root: I[]) => (root as any)[index],
        set: (nums: I[], newValue: I | undefined) =>
            newValue === undefined
                ? [...nums.slice(0, index), ...nums.slice(index + 1)]
                : [...nums.slice(0, index), newValue, ...nums.slice(index + 1)],
    }
}

export function identityLens<A>() {
    return {
        get: (root: A) => root,
        set: (root: A, newValue: any) => newValue,
    }
}

export function keyOrLens2Lens(view: any) {
    if (typeof view === "string") {
        return prop<any, any>(view)
    } else if (typeof view === "number") {
        return item(view as number)
    } else {
        return view as Lens<any, any>
    }
}
