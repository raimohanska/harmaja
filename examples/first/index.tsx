import * as B from "../../src/index"
import { h, mount, ListView } from "../../src/index"

const numbers = B.bus<number>()

const multiplier = B.scan(B.GlobalScope, numbers, 1, (a, b) => a + b)

const interval = B.interval(B.GlobalScope, 3000, 1)
interval.log("INTERVAL")
const ticker = B.scan(B.GlobalScope, interval, 1, (a, b) => a + b)

ticker.log("TICK")

const dots: B.Property<number[]> = B.map(multiplier, count => range(1, count))

const H1 = ({children} : {children?: any[]}) => {
    return <h1 onClick={() => console.log("Clicked")}>{children}</h1>
}

const Plus = ({bus} : {bus: B.Bus<number>}) => {
    return <button onClick={() => bus.push(1)}>+</button>
}

const Minus = ({bus} : {bus: B.Bus<number>}) => {
    return <button onClick={() => bus.push(-1)}>-</button>
}
const ReactiveProps = () => {
    return <input value={ticker} style={B.constant({"background": "black"})}/>
}

const TickerWithMultiplier = ({ multiplier, ticker } : { multiplier: number, ticker: B.Property<number>}) => {
    console.log("Recreating with new multiplier", multiplier)
    return <em>{B.map(ticker, n => n * multiplier)}</em>
}

const Root = () =>
    <div id="root">
        <ReactiveProps/>
        <Plus bus={numbers}/>   
        <H1>Hello <b>World { B.map(multiplier, multiplier => <TickerWithMultiplier {...{multiplier, ticker}}/>) }</b>!</H1>
        Multiplier <Plus bus={numbers}/>{ multiplier }<Minus bus={numbers}/>
        <br/> Naive array handling 
        { B.map(dots, dots => <span>{ dots.map(n => <span>{B.map(ticker, m => m * n)} </span>) } </span>) }
        <br/> Smart array handling 
        <ListView<number, number> {...{ 
            observable: dots, 
            renderItem: (n => <span>{B.map(ticker, m => m * n)} </span>)
        }}/>
        <br/>Handling nulls { null } { B.constant(null) }
    </div>

mount(<Root/>, document.getElementById("root")!)

function range(low: number, high: number) {
    const nums: number[] = []
    for (let i = low; i <= high; i++) {
        nums.push(i)
    }
    return nums
}