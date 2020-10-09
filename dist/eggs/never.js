import { StatefulEventStream } from "./eventstream";
import { globalScope } from "./scope";
export function never() {
    return new StatefulEventStream("never", globalScope);
}
//# sourceMappingURL=never.js.map