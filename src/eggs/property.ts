import { Observer, PropertyEventType, Observable, Property, EventStream, PropertyEvents, Unsub } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { never } from "./eventstream";
import { afterScope, beforeScope, checkScope, globalScope, OutOfScope, Scope } from "./scope";
import { duplicateSkippingObserver } from "./util";

export abstract class StatefulPropertyBase<V> extends Property<V> {
    protected dispatcher = new Dispatcher<PropertyEvents<V>>();
    abstract get(): V

    constructor(desc: string) {
        super(desc)
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        const unsub = this.dispatcher.on(event, observer)
        if (event === "value") {
            observer(this.get())
        }
        return unsub
    }
}

export class DerivedProperty<V> extends Property<V> {
    private sources: Property<any>[];
    private combinator: (...inputs: any[]) => V;
    
    constructor(desc: string, sources: Property<any>[], combinator: (...inputs: any[]) => V) {
        super(desc)
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
        const unsubs = this.sources.map((src, i) => {
            return src.on("change", newValue => {
                currentArray[i] = newValue
                statefulObserver(this.combinator(...currentArray))
            })
        })        
        let currentArray = this.getCurrentArray()
        let initial = this.combinator(...currentArray)
        const statefulObserver = duplicateSkippingObserver(initial, observer)

        if (event === "value") {
            observer(initial)
        }
        return () => {
            unsubs.forEach(f => f())
        }
    }
}

/**
 *  Input source for a StatefulProperty. Returns initial value and supplies changes to observer.
 *  Must skip duplicates!
 **/
export type StatefulPropertySource<V> = (propertyAsChangeObserver: Observer<V>) => [V, Unsub]

export class StatefulProperty<V> extends StatefulPropertyBase<V> {
    private value: V | OutOfScope  = beforeScope
    constructor(desc: string, scope: Scope, source: StatefulPropertySource<V>) {
        super(desc)
        let unsub : Unsub | null = null
        const meAsObserver = (newValue: V) => {
            if (newValue !== this.value) {
                this.value = newValue
                this.dispatcher.dispatch("change", newValue)
                this.dispatcher.dispatch("value", newValue)
            }
        }
        scope(
            () => {
                [this.value, unsub] = source(meAsObserver)
            },
            () => {
                this.value = afterScope; 
                unsub!()
            },
            this.dispatcher
        );
    }
    get(): V {
        return checkScope(this, this.value)
    }
}

export function map<A, B>(prop: Property<A>, fn: (value: A) => B): Property<B> {
    return new DerivedProperty(prop + `.map(fn)`, [prop], fn)
}

export function filter<A>(scope: Scope, prop: Property<A>, predicate: (value: A) => boolean): Property<A> {
    const source = (propertyAsChangeObserver: Observer<A>) => {
        const unsub = prop.on("change", newValue => {
            if (predicate(newValue)) {
                propertyAsChangeObserver(newValue)
            }
        })
        const initialValue = prop.get()
        if (!predicate(initialValue)) {
            throw Error(`Initial value not matching filter for ${prop}`)
        }
        return [initialValue, unsub] as any
    }

    return new StatefulProperty<A>(prop + `.map(fn)`, scope, source);
}

export function toProperty<A>(scope: Scope, stream: EventStream<A>, initial: A) {
    const source = (propertyAsChangeObserver: Observer<A>) => {        
        return [initial, stream.on("value", propertyAsChangeObserver)] as any
    }    
    return new StatefulProperty<A>(stream + `.toProperty(${initial})`, scope, source);
}

export function scan<A, B>(scope: Scope, stream: EventStream<A>, initial: B, fn: (state: B, next: A) => B) {
    const source = (propertyAsChangeObserver: Observer<B>) => {
        let current = initial
        const unsub = stream.on("value", newValue => {
            current = fn(current, newValue)
            propertyAsChangeObserver(current)
        })
        return [initial, unsub] as any
    }    
    return new StatefulProperty<B>(stream + `.scan(fn)`, scope, source);
}

export function constant<A>(value: A): Property<A> {
    return toProperty(globalScope, never(), value)
}