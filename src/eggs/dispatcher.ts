import { Observer, Unsub } from "./abstractions";

const meta = "__meta"
type META = typeof meta

type Dict = { [key: string]: any }

export class Dispatcher<E extends Dict> {
    private observers: { [key: string] : Observer<any>[] | undefined } = {}
    private count = 0

    dispatch<X extends keyof E & string>(key: X, value: E[X]) {
        if (this.observers[key]) for (const s of this.observers[key]!) {
            s(value)
        }
    }

    on<X extends keyof E & string>(key: X, subscriber: Observer<E[X]>): Unsub {
        if (!this.observers[key]) this.observers[key] = [];
        if (this.observers[key]?.includes(subscriber)) {
            console.warn("Already subscribed")
        }
        this.observers[key]!.push(subscriber)
        if (key !== meta) {
            this.count++
            if (this.count == 1) {
                this.dispatch(meta, 1 as any)
            }
        }
        return () => this.off(key, subscriber)
    }

    off<X extends keyof E & string>(key: X, subscriber: Observer<E[X]>) {
        if (!this.observers[key]) return;
        const index = this.observers[key]!.indexOf(subscriber);
        if (index >= 0) {
            this.observers[key]!.splice(index, 1);
            if (this.observers.key?.length === 0) {
                delete this.observers[key]
            }
            if (key !== meta) {
                this.count--
                if (this.count == 0) {
                    this.dispatch(meta, 0 as any)
                }
            }
        }
    }

    onObserverCount(subscriber: Observer<number>) {
        return this.on(meta, subscriber)
    }

    hasObservers(): boolean {
        return this.count > 0
    }
}