import * as React from "../../src/index"
// All the DOM API you're gonna need!

// Creating elements and text nodes
const element = document.createElement("h1")
element.appendChild(document.createTextNode("HELLO WORLD"))

// Event handlers
element.onclick = (e: MouseEvent) => alert("HELLO")

// Setting style as string
element.setAttribute("style", "text-decoration: underline;");

document.getElementById("root")!.appendChild(<div>
        <h1>Hello world</h1>
        <ul>
            <li>Reaktor</li>
            <li>Is</li>
            <li>Best</li>
        </ul>
    </div>)
