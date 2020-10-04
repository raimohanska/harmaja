import { Observer, PropertyEventType, Observable, Property, EventStream } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { never } from "./eventstream";
import { GlobalScope, outOfScope, OutOfScope, Scope } from "./scope";
import { duplicateSkippingObserver } from "./util";

export abstract class StatefulPropertyBase<V> extends Property<V> {
    protected dispatcher: Dispatcher<V, PropertyEventType>;
    abstract get(): V

    constructor() {
        super()
        this.dispatcher = new Dispatcher<V, PropertyEventType>();
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        if (event === "value") {
            observer(this.get())
        }
        return this.dispatcher.on(event, observer)
    }
}

export class DerivedProperty<V> extends Property<V> {
    private sources: Property<any>[];
    private combinator: (...inputs: any[]) => V;
    
    constructor(sources: Property<any>[], combinator: (...inputs: any[]) => V) {
        super()
        this.sources = sources;
        this.combinator = combinator;
    }

    get(): V {
        return this.combinator(...this.getCurrentArray())
    }

    private getCurrentArray(): any[] {
        return this.sources.map(s => s.get())
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        let currentArray = this.getCurrentArray()
        let initial = this.combinator(...currentArray)
        const statefulObserver = duplicateSkippingObserver(initial, observer)

        if (event === "value") {
            observer(initial)
        }
        const unsubs = this.sources.map((src, i) => {
            return src.on("change", newValue => {
                currentArray[i] = newValue
                statefulObserver(this.combinator(...currentArray))
            })
        })        
        return () => {
            unsubs.forEach(f => f())
        }
    }
}

/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
export type StatefulPropertySource<V> = (propertyAsChangeObserver: Observer<V>) => V

export class StatefulProperty<V> extends StatefulPropertyBase<V> {
    private value: V | OutOfScope  = outOfScope
    constructor(scope: Scope, source: StatefulPropertySource<V>) {
        super()
        const meAsObserver = (newValue: V) => {
            if (newValue !== this.value) {
                this.value = newValue
                this.dispatcher.dispatch("change", newValue)
                this.dispatcher.dispatch("value", newValue)
            }
        }
        scope.on("in", () => {
            this.value = source(meAsObserver);
        })
        scope.on("out", () => {
            this.value = outOfScope;
        })
    }
    get(): V {
        if (this.value === outOfScope) throw Error("Property out of scope");
        return this.value as V;
    }
}

export function map<A, B>(prop: Property<A>, fn: (value: A) => B): Property<B> {
    return new DerivedProperty([prop], fn)
}

export function filter<A>(scope: Scope, prop: Property<A>, predicate: (value: A) => boolean): Property<A> {
    const source = (propertyAsChangeObserver: Observer<A>) => {
        prop.on("change", newValue => {
            if (predicate(newValue)) {
                propertyAsChangeObserver(newValue)
            }
        })
        const initialValue = prop.get()
        if (!predicate(initialValue)) {
            throw Error("Initial value not matching filter")
        }
        return initialValue
    }

    return new StatefulProperty<A>(scope, source);
}

export function toProperty<A>(scope: Scope, stream: EventStream<A>, initial: A) {
    const source = (propertyAsChangeObserver: Observer<A>) => {
        stream.on("value", propertyAsChangeObserver)
        return initial
    }    
    return new StatefulProperty<A>(scope, source);
}

export function scan<A, B>(scope: Scope, stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B) {
    const source = (propertyAsChangeObserver: Observer<B>) => {
        let current = initial
        stream.on("value", newValue => {
            current = fn(current, newValue)
            propertyAsChangeObserver(current)
        })
        return initial
    }    
    return new StatefulProperty<B>(scope, source);
}

export function constant<A>(value: A): Property<A> {
    return toProperty(GlobalScope, never(), value)
}