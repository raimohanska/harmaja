import { h } from "../../src/jsxfactory"
import * as B from "baconjs"

const ones = B.interval(1000, 1) // EventStream
const counter = ones.scan(0, (state, next) => state + next)
const click = new B.Bus<string>()
const latestClick = click.toProperty("")
const state = B.combineTemplate({ counter, latestClick })

const ListComponent = ({ stuff } : { stuff : string[] }) => {
    return <ul>
        { stuff.map(str => <li onClick={e => { alert(str) }}>{str}</li>) }
    </ul>
}

document.getElementById("root")!.appendChild(<div>
        <h1>Hello world {state.map(s => s.counter.toString())} </h1>
        <ListComponent stuff={["Reaktor", "iz", "teh", "bestest"]}/>
    </div>)
