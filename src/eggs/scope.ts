import { Observer } from "./abstractions"

export interface Scope {
    on(event: "in", observer: Observer<void>): void
    on(event: "out", observer: Observer<void>): void
}

export const GlobalScope: Scope = {
    on(event: "in" | "out", observer: Observer<void>) {
        if (event === "in") {
            observer()
        }
    }
}

export const outOfScope = {}
export type OutOfScope = typeof outOfScope