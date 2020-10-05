import { Bus, EventStream, Observer, StreamEventType } from "./abstractions"
import { BaseEventStream } from "./eventstream"
import { Dispatcher } from "./dispatcher"
import { globalScope } from "./scope"

export function bus<V>(): Bus<V> {
    return new BusImpl<V>()
}

// Note that we could use a Dispatcher as Bus, except for prototype inheritance of EventStream on the way
class BusImpl<V> extends BaseEventStream<V> implements Bus<V> {
    constructor() {
        super("bus", globalScope)
        this.push = this.push.bind(this)
    }

    push(newValue: V) {
        this.dispatcher.dispatch("value", newValue)
    }
}