import * as L from "lonna"
import { h, mount, ListView } from "../../src/index"

const numbers = L.bus<number>()

const multiplier = numbers.pipe(L.scan(1, (a, b) => a + b, L.globalScope))
const interval = L.interval(3000, 1)
const ticker = interval.pipe(L.scan(1, (a, b) => a + b, L.globalScope))

ticker.log("TICK")

const dots: L.Property<number[]> = L.view(multiplier, count => range(1, count))

const H1 = ({children} : {children?: any[]}) => {
    return <h1 onClick={() => console.log("Clicked")}>{children}</h1>
}

const Plus = ({bus} : {bus: L.Bus<number>}) => {
    return <button onClick={() => bus.push(1)}>+</button>
}

const Minus = ({bus} : {bus: L.Bus<number>}) => {
    return <button onClick={() => bus.push(-1)}>-</button>
}
const ReactiveProps = () => {
    return <input value={ticker} style={L.constant({"background": "black"})}/>
}

const TickerWithMultiplier = ({ multiplier, ticker } : { multiplier: number, ticker: L.Property<number>}) => {
    console.log("Recreating with new multiplier", multiplier)
    return <em>{L.view(ticker, n => n * multiplier)}</em>
}

const Root = () =>
    <div id="root">
        <ReactiveProps/>
        <Plus bus={numbers}/>   
        <H1>Hello <b>World { multiplier.pipe(L.map(multiplier => <TickerWithMultiplier {...{multiplier, ticker}}/>)) }</b>!</H1>
        Multiplier <Plus bus={numbers}/>{ multiplier }<Minus bus={numbers}/>
        <br/> Naive array handling 
        { L.view(dots, dots => <span>{ dots.map(n => <span>{L.view(ticker, m => m * n)} </span>) } </span>) }
        <br/> Smart array handling 
        <ListView<number, number> {...{ 
            observable: dots, 
            renderItem: (n => <span>{L.view(ticker, m => m * n)} </span>)
        }}/>
        <br/>Handling nulls { null } { L.constant(null) }
    </div>

mount(<Root/>, document.getElementById("root")!)

function range(low: number, high: number) {
    const nums: number[] = []
    for (let i = low; i <= high; i++) {
        nums.push(i)
    }
    return nums
}