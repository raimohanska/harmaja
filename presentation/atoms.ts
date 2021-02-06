import * as L from "lonna"

const state = L.atom({ id: 1, name: "hello" })
console.log(state.get())
