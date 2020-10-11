import * as B from "lonna"

import { h, mount, ListView, unmountEvent } from "../../src/index"
import { todoItem, TodoItem, Id } from "./domain";
import { saveChangesToServer, ServerFeedEvent, listenToServerEvents, findIndex } from "./server";

const scrollPos = B.fromEvent(window, "scroll").map(() => window.scrollY).map(Math.floor).toProperty(window.scrollY)
scrollPos.forEach() // <- to keep it updated even when no actual subscribers

const randomColor = () => "#" + Math.floor(Math.random()*16777215).toString(16);

const Item = ({ text }: { text: B.Property<string> }) => {
  return <div style={{ background: randomColor(), minHeight: "100px" }}>{ text }</div>
}

const items = (function() {
  const count = 100;
  const xs = []
  for (var i = 0; i < count; i++) {
    xs.push(i.toString())
  }
  return xs
})()

const ScrollingThing = () => {
  return (    
    <div>
      {
        items.map(i => <Item text={i}/>)
      }
    </div>
  );
};

const ScrollPosDisplay = () => {
  scrollPos.doLog("snoop")
    .takeUntil(unmountEvent()) // takeUntil is necessary here! Otherwise the forEach side-effect will continue after component unMount
    .forEach( pos => console.log(pos) )
  return <div style={{ position: "fixed", right: "20px", background: "black", color: "white", padding: "10px" }}>{ 
    scrollPos /* This is ok! Harmaja will unsubscribe if the component is unmounted */
  }</div>
}

const App = () => {
  const showScroller = B.atom(true)
  return <div>
    <button onClick={ () => showScroller.modify(x => !x) } style={{ position: "fixed", right: "80px" }}>Toggle visibility</button>
    {
      B.map(showScroller, show => show ? <ScrollPosDisplay/> : null)
    }
    <ScrollingThing/>
  </div>
}


mount(<App/>, document.getElementById("root")!)