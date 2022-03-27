import * as L from "lonna"
import { h, mount, ListView } from "../../src/index"
import { globalScope } from "lonna"

const itemCount = 1000
const itemDetailCount = 50
const changes = L.bus<Item>()
type Item = {
    name: string
}
type State = {
    items: Item[]
}
function mkState(): State {
    return {
        items: range(0, itemCount).map((n) => ({ name: `item-${n}` })),
    }
}

console.log("Wat")

// Using scan for similarity to OurBoard
const state = changes.pipe(
    L.scan(mkState(), (state, newItem) => ({
        ...state,
        items: state.items.concat(newItem),
    })),
    L.applyScope(globalScope)
)

const Root = () => (
    <div id="root">
        <h1>Harmaja perf test setup</h1>
        <ListView<Item, string>
            observable={L.view(state, "items")}
            renderObservable={(key, item) => <Comp item={item} />}
            getKey={(item) => item.name}
        />
    </div>
)

const Comp = ({ item }: { item: L.Property<Item> }) => (
    <div>
        {range(0, itemDetailCount).map((n) => (
            <span>{L.view(item, (i) => n)}</span>
        ))}
    </div>
)

mount(<Root />, document.getElementById("root")!)

function range(low: number, high: number) {
    const nums: number[] = []
    for (let i = low; i <= high; i++) {
        nums.push(i)
    }
    return nums
}
