import * as React from "../../src/index"
// All the DOM API you're gonna need!

// Creating elements and text nodes
const element = document.createElement("h1")
element.appendChild(document.createTextNode("HELLO WORLD"))

// Event handlers
element.onclick = (e: MouseEvent) => alert("HELLO")

// Setting style as string
element.setAttribute("style", "text-decoration: underline;");

const ListComponent = ({ stuff } : { stuff : string[] }) => {
    return <ul>
        { stuff.map(str => <li>{str}</li>) }
    </ul>
}

document.getElementById("root").appendChild(<div>
        <h1>Hello world</h1>
        <ListComponent stuff={["Reaktor", "iz", "teh", "bestest"]}/>
    </div>)
