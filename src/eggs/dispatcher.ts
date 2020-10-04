import { Observer, Unsub } from "./abstractions";

export class Dispatcher<V, E extends string> {
    private subscribers: { [key: string] : Observer<V>[] | undefined } = {}

    dispatch(key: E, value: V) {
        if (this.subscribers[key]) for (const s of this.subscribers[key]!) {
            s(value)
        }
    }

    on(key: E, subscriber: Observer<V>): Unsub {
        if (!this.subscribers[key]) this.subscribers[key] = [];
        this.subscribers[key]!.push(subscriber)
        return () => this.off(key, subscriber)
    }

    off(key: E, subscriber: Observer<V>) {
        if (!this.subscribers[key]) return;
        const index = this.subscribers[key]!.indexOf(subscriber);
        if (index >= 0) {
            this.subscribers[key]!.splice(index, 1);
        }
    }

    hasObservers(key: E): boolean {
        return this.subscribers[key] !== undefined && this.subscribers[key]!.length > 0
    }
}