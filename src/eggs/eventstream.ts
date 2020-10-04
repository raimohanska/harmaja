import { EventStream, StreamEventType, Observer } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { Scope } from "./scope";

// Note that we could use a Dispatcher as Bus, except for prototype inheritance of EventStream on the way
export class BaseEventStream<V> extends EventStream<V> {
    protected dispatcher = new Dispatcher<V, StreamEventType>();
    constructor() { super() }

    on(event: "value", observer: Observer<V>) {
        return this.dispatcher.on(event, observer)
    }
}

export function never<A>(): EventStream<A> {
    return new BaseEventStream()
}

export function interval<V>(scope: Scope, delay: number, value: V) {
    return new Interval(scope, delay, value)
}

class Interval<V> extends BaseEventStream<V> {
    constructor(scope: Scope, delay: number, value: V) { 
        super()         
        let interval: any
        scope.on("in", () => {
            interval = setInterval(() => this.dispatcher.dispatch("value", value), delay)
        })
        scope.on("out", () => {
            clearInterval(interval)
        })
    }
}