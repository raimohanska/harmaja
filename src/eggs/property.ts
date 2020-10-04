import { Observer, PropertyEventType, Observable, Property } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { outOfScope, OutOfScope, Scope } from "./scope";
import { duplicateSkippingObserver } from "./util";

export abstract class StatefulPropertyBase<V> implements Observable<V, PropertyEventType> {
    protected dispatcher: Dispatcher<V, PropertyEventType>;
    abstract get(): V

    constructor() {
        this.dispatcher = new Dispatcher<V, PropertyEventType>();
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        if (event === "value") {
            observer(this.get())
        }
        this.dispatcher.on(event, observer)
    }
}

export class DerivedProperty<V> implements Property<V> {
    private sources: Property<any>[];
    private combinator: (inputs: any[]) => V;
    
    constructor(sources: Property<any>[], combinator: (inputs: any[]) => V) {
        this.sources = sources;
        this.combinator = combinator;
    }

    get(): V {
        return this.combinator(this.getCurrentArray())
    }

    private getCurrentArray(): any[] {
        return this.sources.map(s => s.get())
    }

    on(event: PropertyEventType, observer: Observer<V>) {
        let currentArray = this.getCurrentArray()
        let initial = this.combinator(currentArray)
        const statefulObserver = duplicateSkippingObserver(initial, observer)

        if (event === "value") {
            observer(initial)
        }
        this.sources.forEach((src, i) => {
            src.on("change", newValue => {
                currentArray[i] = newValue
                statefulObserver(this.combinator(currentArray))
            })
        })        
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
            this.value = newValue
            this.dispatcher.dispatch("change", newValue)
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