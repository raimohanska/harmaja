import * as H from "../../src/index"
// All the DOM API you're gonna need!

// Creating elements and text nodes
const element = document.createElement("h1")
element.appendChild(document.createTextNode("HELLO WORLD"))
document.getElementById("root")!.appendChild(element)

// Event handlers
element.onclick = (e: MouseEvent) => alert("HELLO")