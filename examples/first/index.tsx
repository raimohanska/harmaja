import * as JSX from "../../src/jsxfactory"
import * as Bacon from "baconjs"
import { mount, ListView } from "../../src/index"

const numbers = new Bacon.Bus<number>()

const multiplier = numbers.scan(1, (a, b) => a + b)

const ticker = Bacon.interval(3000, 1).scan(1, (a, b) => a + b)

const dots = multiplier.map(count => range(1, count))

const H1 = ({children} : {children: any[]}) => {
    return <h1 onClick={() => console.log("Clicked")}>{children}</h1>
}

const Plus = ({bus} : {bus: Bacon.Bus<number>}) => {
    return <button onClick={() => bus.push(1)}>+</button>
}

const Minus = ({bus} : {bus: Bacon.Bus<number>}) => {
    return <button onClick={() => bus.push(-1)}>-</button>
}

const Reactive = () => {
    return Bacon.constant(<span>reactive</span>)
}

const TickerWithMultiplier = ({ multiplier, ticker } : { multiplier: number, ticker: Bacon.Property<number>}) => {
    console.log("Recreating with new multiplier", multiplier)
    return <em>{ticker.map(n => n * multiplier)}</em>
}

const Root = () =>
    <div id="root">
        <Reactive/>
        
        <Plus bus={numbers}/>   
             
        <H1>Hello <b>World { multiplier.map(multiplier => <TickerWithMultiplier {...{multiplier, ticker}}/>) }</b>!</H1>
        Multiplier <Plus bus={numbers}/>{ multiplier }<Minus bus={numbers}/>
        <br/> Naive array handling 
        { dots.map(dots => <span>{ dots.map(n => <span>{ticker.map(m => m * n)} </span>) } </span>) }
        <br/> Smart array handling 
        <ListView {...{ 
            observable: dots, 
            renderItem: ((n: number) => <span>{ticker.map(m => m * n)} </span>),
            equals: (x, y) => x === y
        }}/>
        <br/>Handling nulls { null } { Bacon.constant(null) }
    </div>

mount(<Root/>, document.getElementById("root")!)

function range(low: number, high: number) {
    const nums: number[] = []
    for (let i = low; i <= high; i++) {
        nums.push(i)
    }
    return nums
}