import { Observer, Unsub } from "./abstractions"
import { Dispatcher } from "./dispatcher"

export interface Scope {
    on(event: "in" | "out", observer: Observer<void>): Unsub    
}

export interface MutableScope extends Scope {
    start(): void;
    end(): void;
}

export const GlobalScope: Scope = {
    on(event: "in" | "out", observer: Observer<void>) {
        if (event === "in") {
            observer()
        }
        return () => {}
    }
}

export function scope(): MutableScope {
    let started = false
    const dispatcher = new Dispatcher<void, "in" | "out">();
    return {
        on(event: "in" | "out", observer: Observer<void>) {
            if (event === "in" && started) {
                observer()
                return () => {}
            } else {
                return dispatcher.on(event, observer)
            }
        },
        start() {
            started = true
            dispatcher.dispatch("in")
        },
        end() {
            started = false
            dispatcher.dispatch("out")
        }
    }
}

export const outOfScope = {}
export type OutOfScope = typeof outOfScope