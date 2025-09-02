import { h, mount, ListView, Signal, constantSignal, atomFromValue } from "../../src/index"

const multiplier = atomFromValue(1)
const ticker = atomFromValue(1)
setInterval(() => {
    ticker.modify(v => v + 1)
}, 3000)

ticker.log("TICK")

const reducer = (diff: number) => (value: number) => value + diff
type Dispatch = (n: number) => void
const dispatch: Dispatch = (value: number) => multiplier.modify(reducer(value))

const dots: Signal<number[]> = multiplier.map(count => range(1, count))

const H1 = ({children} : {children?: any[]}) => {
    return <h1 onClick={() => console.log("Clicked")}>{children}</h1>
}

const Plus = ({dispatch}: {dispatch: Dispatch}) => {
    return <button onClick={() => dispatch(1)}>+</button>
}

const Minus = ({dispatch}: {dispatch: Dispatch}) => {
    return <button onClick={() => dispatch(-1)}>-</button>
}

const ReactiveProps = () => {
    return <input value={ticker} style={constantSignal({"background": "#ee8"})}/>
}

const TickerWithMultiplier = ({ multiplier, ticker } : { multiplier: number, ticker: Signal<number>}) => {
    console.log("Recreating with new multiplier", multiplier)
    return <em>{ticker.map(n => n * multiplier)}</em>
}

const Root = () =>
    <div id="root">
        <ReactiveProps/>
        <Plus dispatch={dispatch}/>   
           
        <H1>Hello <b>World { multiplier.map(multiplier => <TickerWithMultiplier {...{multiplier, ticker}}/>) }</b>!</H1>
        Multiplier <Plus dispatch={dispatch}/>{ multiplier }<Minus dispatch={dispatch}/>
        <br/> Naive array handling 
        { dots.map(dots => <span>{ dots.map(n => <span>{ticker.map(m => m * n)} </span>) } </span>) }
        <br/> Smart array handling 
        <ListView<number, number> {...{ 
            observable: dots, 
            renderItem: (n => <span>{ticker.map(m => m * n)} </span>)
        }}/>
        <br/>Handling nulls { null } { constantSignal(null) }
    </div>

mount(<Root/>, document.getElementById("root")!)

function range(low: number, high: number) {
    const nums: number[] = []
    for (let i = low; i <= high; i++) {
        nums.push(i)
    }
    return nums
}