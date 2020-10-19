import * as B from "lonna"
import { h, mount, ListView } from "../../src/index"

const numbers = B.bus<number>()

// TODO: API ergonomics
const multiplier = numbers.pipe(B.scan(1, (a, b) => a + b, B.globalScope))
const interval = B.interval(3000, 1)
const ticker = interval.pipe(B.scan(1, (a, b) => a + b, B.globalScope))

ticker.log("TICK")

const dots: B.Property<number[]> = multiplier.pipe(B.map((count: number) => range(1, count)))

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
    return <em>{ticker.pipe(B.map((n: number) => n * multiplier))}</em>
}

const Root = () =>
    <div id="root">
        <ReactiveProps/>
        <Plus bus={numbers}/>   
        <H1>Hello <b>World { multiplier.pipe(B.map((multiplier: number) => <TickerWithMultiplier {...{multiplier, ticker}}/>)) }</b>!</H1>
        Multiplier <Plus bus={numbers}/>{ multiplier }<Minus bus={numbers}/>
        <br/> Naive array handling 
        { dots.pipe(B.map((dots: number[]) => <span>{ dots.map((n: number) => <span>{ticker.pipe(B.map((m: number) => m * n))} </span>) } </span>)) }
        <br/> Smart array handling 
        <ListView<number, number> {...{ 
            observable: dots, 
            renderItem: (n => <span>{ticker.pipe(B.map((m: number) => m * n))} </span>)
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