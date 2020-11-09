import fs from "fs"
import { Atom, atom, bus, pipe, scan, globalScope, view } from "lonna"

const _state = { 
    name: "user",
    password: "password1!"
}

const action = {
    action: "setname",
    name: "juha"
}

type State = { name: string, password: string}
type Action = SetName | SetPassword
type SetName = { action: "setname", name: string }
type SetPassword = { action: "setpassword", password: string }

function reducer(s: State, a: Action) {
    switch(a.action) {
        case "setname":
            return { ...s, name: a.name }
        case "setpassword":
            return { ...s, password: a.password }
    }
}

const events = bus<Action>()
const state = pipe(events, 
    scan({ name: "", password: "" }, reducer, globalScope))

events.push({ action: "setname", name: "admin" })
console.log(state.get())
state.forEach(s => console.log(s))

const stateAtom: Atom<State> = atom({ 
    name: "user",
    password: "password1!"
})

const name: Atom<string> = view(stateAtom, "name")
const password = view(stateAtom, "password")

name.set("admin")
console.log(stateAtom.get())
stateAtom.forEach(s => console.log(s))

export const abomination = atom(
    view(state, "name"),
    newName => events.push({ 
        action: "setname", 
        name: newName 
    })
)