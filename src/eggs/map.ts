import { Property } from "./abstractions";
import { DerivedProperty } from "./property";

export function map<A, B>(prop: Property<A>, fn: (value: A) => B): Property<B> {
    return new DerivedProperty(prop + `.map(fn)`, [prop], fn)
}