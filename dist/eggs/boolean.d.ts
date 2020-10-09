import { Property } from "./abstractions";
export declare function or(left: Property<boolean>, right: Property<boolean>): Property<boolean>;
export declare function and(left: Property<boolean>, right: Property<boolean>): Property<boolean>;
export declare function not(prop: Property<boolean>): Property<boolean>;
