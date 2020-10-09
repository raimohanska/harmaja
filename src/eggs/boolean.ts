import { combine } from "./combine";
import { Property } from "./abstractions"
import { map } from "./map";

export function or(left: Property<boolean>, right: Property<boolean>): Property<boolean> {
    return combine(left, right, (x, y) => x || y)
}

export function and(left: Property<boolean>, right: Property<boolean>): Property<boolean> {
    return combine(left, right, (x, y) => x && y)
}

export function not(prop: Property<boolean>): Property<boolean> {
    return map(prop, x => !x)
}