import { DerivedProperty } from "./property";
export function combine() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var properties = args.slice(0, args.length - 1);
    var f = args[args.length - 1];
    return new DerivedProperty("combine(" + properties + ", fn)", properties, f);
}
;
//# sourceMappingURL=combine.js.map