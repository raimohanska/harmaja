import * as B from "lonna"

import { h, mount, componentScope } from "../../src/index"

const scrollPos = B.toStatelessProperty( B.fromEvent(window, "scroll"), () => Math.floor(window.scrollY))

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
  const mapped = B.map(scrollPos, x => { console.log("Scrollpos subscription active", x); return x })
  // TODO: side-effects story in Readme. Make sure to mention that properties cannot be subscribe to out of scope, but their changes can
  
  // By calling applyScope, the side-effect is only applied while component stays mounted
  // We cannot subscribe here to the Property because it's out of scope and it will fail to produce a current value
  B.changes(B.applyScope(componentScope(), mapped))
    .forEach(value => {
      console.log("Performing side-effects for value", value)
    })

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