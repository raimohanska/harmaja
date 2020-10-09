import { EventStream, StreamEventType, Observer, StreamEvents, Unsub, EventStreamSeed } from "./abstractions";
import { applyScope } from "./applyscope";
import { Dispatcher } from "./dispatcher";
import { globalScope, Scope } from "./scope";

// Note that we could use a Dispatcher as Bus, except for prototype inheritance of EventStream on the way
export class StatefulEventStream<V> extends EventStream<V> {
    protected dispatcher = new Dispatcher<StreamEvents<V>>();
    private _scope: Scope;
    constructor(desc: string, scope: Scope) { 
        super(desc) 
        this._scope = scope
    }

    on(event: "value", observer: Observer<V>) {
        return this.dispatcher.on(event, observer)
    }
    scope() {
        return this._scope
    }
}

export class StatelessEventStream<V> extends EventStream<V> {
    private _scope: Scope;
    forEach: (observer: Observer<V>) => Unsub;

    constructor(desc: string, forEach: (observer: Observer<V>) => Unsub, scope: Scope);
    constructor(seed: EventStreamSeed<V>, scope: Scope);

    constructor() { 
        let desc: string, forEach: (observer: Observer<V>) => Unsub, scope: Scope
        if (arguments[0] instanceof EventStreamSeed) {
            const seed = arguments[0]
            desc = seed.desc
            forEach = seed.forEach
            scope = arguments[1]
        } else {
            desc = arguments[0]
            forEach = arguments[1]
            scope = arguments[2]
        }
        super(desc) 
        this._scope = scope
        this.forEach = forEach
    }

    on(event: "value", observer: Observer<V>) {
        return this.forEach(observer)
    }

    scope() {
        return this._scope
    }
}