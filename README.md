# Harmaja

An experimental web frontend framework named after a lighthouse. It maybe easiest to describe it in contrast to React. 

- Uses JSX syntax just like React
- Function components only
- Component function is treated like a *constructor*, i.e. called just once per component lifecycle
- Dynamic content passed to components as observable properties
- Uses Bacon.js for observables at the moment
- Strongly inspired by [Calmm.js](https://github.com/calmm-js/documentation/blob/master/introduction-to-calmm.md). If you're familiar with Calmm, you can think of Harmaja as "Calmm, but with types and no React dependency

The documentation here is lacking, and it will help if you're already familiar with Redux, Calmm.js and Bacon.js (or other reactive library such as RxJs).

Published on NPM: https://www.npmjs.com/package/harmaja

## Key concepts

*Reactive Property* (also known as a signal or a behaviour) is an object that encapsulates a changing value. Please check out the [Bacon.js intro](https://baconjs.github.io/api3/index.html) if you're not familiar with the concept. In Harmaja, reactive properties are the main way of storing and passing application state.

*EventStream* represents a stream of events that you can observe by calling its `forEach` method. In Bacon.js a *Bus* is an EventStream that allows you to `push` events to the stream as well as observe events. In Harmaja, buses are used for conveying distinct events from the UI to state reducers.

*Atom* is a Property that also allows mutation using the `set` methods. You can create an atom simply by `atom("hello")` and then use `atom.get` and `atom.set` for viewing and mutating its value. May sound underwhelming, but the Atom is also a reactive property, meaning that it's state can be observed and *reacted*. In Harmaja particularly, you can embed atoms into your VDOM so that your DOM will automatically reflect the changes in their value! Furthermore, you can use `atom.view("attributename")` to get a new Atom that represents the state of a given attribute within the data structure wrapped by the original Atom.

*State decomposition* means selecting a part or a slice of a bigger state object. This may be familiar to you from Redux, where you `mapStateToProps` or `useSelector` for making your component *react* to changes in some parts of the application state. In Harmaja, you use reactive properties or Atoms for representing state and then select parts of it for your component using `property.map` or `atom.view`, the latter providing a read-write interface.

*State composition* is the opposite of the above (but will co-operate nicely) and means that you can compose state from different sources. This is also a familiar concept from Redux, if you have ever composed reducers. 

You can very well combine the above concepts so that you start with several state atoms and event streams, then compose them all into a single "megablob" and finally decompose from there to deliver the essential parts of each of your components.

## Examples

Part of my process has been validating my work with some examples I've previously used for the comparison of different React state management solutions. 

First, let's consider a TODO app. See the [examples/todoapp/index.tsx](examples/todoapp/index.tsx). I've added some annotations. In this example, application state is reduced from different events (add/remove/complete todo item).

Then there's the same application using Atoms [examples/todoapp-atoms/index.tsx](examples/todoapp-atoms/index.tsx). It's rather less verbose, because with Atoms, you can decompose and manipulate substate directly using `atom.set` instead using events and reducers.

Finally a bit more involved example featuring a "CRM": [examples/consultants/index.tsx](examples/consultants/index.tsx). It features some harder problems like dealing with asynchronous (and randomly failing!) server calls as well as edit/save/cancel.

## Motivation and background

For a long time I've been pondering different state management solutions for React. My thinkin in this field is strongly affected byt the fact that I'm pretty deep into Observables and FRP (functional reactive programming) and have authored the Bacon.js library back in the day. I've seen many approaches to frontend state management and haven't been entirely satisfied with any of them. This has lead into spending lots of time considering how I could apply FRP to state management in an "optimal" way.

So one day I had some spare time and couldn't go anywhere so I started drafting on what would be my ideal "state management solution". I wrote down the design goals, which are in no particular priority order at the moment.

- G1 Intuitive: construction, updates, teardown
- G2 Safe: no accidental updates to nonexisting components etc.
- G3 Type-safe (Typescript)
- G4 Immutable data all the way
- G5 Minimum magic (no behind-the-scenes watching of js object property changes etc)
- G6 Small API surface area
- G7 Small runtime footprint    
- G8 Easy mapping of (changing) array of data items to UI elements
- G9 Easy to interact with code outside the "framework": don't get in the way, this is just programming
- GA Minimal boilerplate
- GB Composability, state decomposition (Redux is composing, Calmm.js with lenses is decomposing)
- GC Easy and intuitive way of creating local state (and pushing it up the tree when need arises)
- GD Performant updates with minimal hassle. No rendering the full page when something changes

Calmm.js, by [Vesa] (https://github.com/polytypic), is pretty close! It uses Atoms and Observables for state management and treats React function components essentially as constructors. This approach makes it straightforward to introduce, for example, local state variables as regular javascript variables in the "constructor" function. It treats local and global state similarly and makes it easy to refactor when something needs to change from local to higher-up in the tree.

Yet, it's not type-safe and is hard to make thus. Especially the highly flexible [partial.lenses](https://github.com/calmm-js/partial.lenses) proves hard. Also, when looking at it more closely, it goes against the grain of how React is usually used, which will make it a bit awkward for React users. Suddenly you have yet another kind of component at your disposal, which expects you not to call it again on each render. In fact, I felt that Calmm.js doesn't really need anything from React which is more in the way instead of being helpful. 

A while ago Vesa once-gain threw a mindblowing demonstration of how he had adapted the Calmm approach to WPF using C#. This opened my eyes to the fact that you don't need a VDOM diffing framework to do this. It's essentially just about calling component constructors and passing reactive variables down the tree.

After some hours of coding I had ~200 lines of Typescript which already rendered function components and allowed embedding reactive values into the VDOM, replacing actual DOM nodes when the reactive value changed. After some more hours of coding I have a prototype-level library that you can also try out. Let me hear your thoughts!

## Unidirectional data flow

Unidirectional data flow, popularized by Redux, is a leading state management pattern in web frontends today. In short, it means that you have a (usually essentially) global data *store* or stores that represent pretty much the entire application state. Changes to this state are not effected directly by UI components but instead by dispacthing *events* or *actions* which then are processed by *reducers* and applied to the global state. The state is treated as an immutable object and every time the reducers applies a new change to state, it effectively creates an entire new state object. 

In Typescript, you could represent these concepts in the context of a Todo App like this:

```
type Item = {}
type Event = {type:"add", item:Item } | {type:"remove", item:Item }
type State = {items: Item[]}
type Reducer = (currentState: State, event: Event) => State
interface Store {
    dispatch(event: Event)
    subscribe(observer: (event: Event) => void)
}
```

In this scenario, UI components will `subscribe` to changes in the `Store` and `dispatch` events to effect state changes. The store will apply its `Reducer` to incoming events and the notify the observer components on updated state.

The benefits are (to many, nowadays) obvious. These come from the top of my mind.

- Reasoning about state changes is straightforward, as only reducers change state. You can statically backtrack all possible causes of a change to a particular part of application state.
- The immutable global state object makes persisting and restoring application state easier, and makes it possible to create and audit trail of all events and state history. It also makes it easier to pass the application state for browser-side hydration after a server-side render.
- Generally, reasoning about application logic is easier if there is a pattern, instead of a patchwork of ad hoc solutions

Implementations such as Redux allow components to *react* to a select part of global state (instead of all changes) to avoid expensive updates. With React hooks, you can conveniently just `useSelector(state => pick interesting parts)` and you're done.

It's not a silver bullet though. Especially when using a single global store with React / Redux

- There is no solution for local or scoped state. Sometimes you need scoped state that applies, for instance, to the checkout process of your web store. Or to widely used components such as an address selector. Or for storing pending changes to, say, user preferences before applying them to the global state.
- This leads to either using React local state or some "corner" of the global state for these transient pieces of state
- Refactoring state from local to global is tedious and error-prone because you use an entirely different mechanism for each
- You cannot encapsulate functionalities (store checkout) into self-sustaining components because they are dependent on reducers which lively somewhere else completely

Other interesting examples of Unidirectional data flow include [Elm](https://elm-lang.org/) and [Cycle.js](https://cycle.js.org/).

In Harmaja, you can implement Unidirectional data flow too. Sticking with the Todo App example, you define your events as *buses*:

```
import * as B from "baconjs"

const addItemBus = new B.Bus<TodoItem>();
const removeItemBus = new B.Bus<TodoItem>();
```

The bus objects allow you to dispatch an event by calling their `push` method. From the events, the application state can be reduced like thus:

```
const allItems: B.Property<TodoItem[]> = B.update([], 
    [addItemBus, (items, item) => items.concat(item)],
    [removeItemBus, (items, item) => items.filter(i => i.id !== item.id)]
)
```

You can, if you like, then encapsulate all this into something like

```
interface TodoStore {
    add: B.Bus<TodoItem>()
    remove: B.Bus<TodoItem>()
    items: B.Property<TodoItem[]>
}
```

...so you have an encapsulation of this piece of application state, and you can pass this store to your UI components.

A notable different to Redux is that there are no action creators and reducers per se. You define distinct events a derive state from them. You can also define the buses and the derived state properties in your components if you want to have scoped state. There is no such thing as *react context* in Harmaja, so everything has to be passed explicitly or defined in a global scope, at least for now. 

See the full example [here](examples/todoapp/index.tsx).

## Beyond Unidirectional data flow

As mentioned above, I find it convenient to be able to put state to different scopes instead of having everything in a global megablob. Also, I find the event-reducer-state model a bit cumbersome for some cases. When you're *editing* data, you'll have a lot of components that practically need read-write access to data. Let's say you are doing something really simple, such as an text input component for editing a single string.

```
const TextInput = ({value}: {text: B.Property<string>}) => {
    return <input value={text} />
}
```


This component has a reactive property `text` as a prop and it renders the current value into the `value` attribute of the input element. Notice that in Harmaja, you can in fact just embed a reactive property into your VDOM! As a result the DOM element will be automatically updated when the `text` property changes. Note also that this TextInput function is treated like a constructor instead of being called everytime something changes.

Anyway, we somehow need to pass changes back from this component to the store. One way to do it would be to pass a `onChange: string => void` parameter so that the change to this field would be passed to the "global reducer" and state change applied. However, you don't generally want to be handling individual strings in your big time reducers do you? More likely you'll be using this input component as a part of something larger, like


```
type Address = {
    name: string,
    addressLine1: string,
    // etc
}

const AddressEditor = ({ address, onChange } : { address : B.Property<Address>, onChange: (a: Address) => void }) => {
    return <div>
        <TextInput value={address.map(a => a.name)}>
        <TextInput value={address.map(a => a.addressLine1)}>
        ...etc...
    </div>
}
```

And from this component you may want to dispatch an *address changed* event somewheres. Possibly on each individual keystroke or alternatively, when the user
clicks "Save". And you'll wish changing between these two alternatives is not too hard, right. If I had introduced the `onChange` bus to TextInput, the AddressEditor might end up something like this.


```
    const nameChanged = (name) => address.take(1).forEach(a => onChange({ ...a, name })
    return <div>
        <TextInput value={address.map(a => a.name)} onChange={nameChanged}>
    </div>
}
```

Or a little shorter using the `getCurrentValue` helper function:

```
const AddressEditor = ({ address, onChange } : { address : B.Property<Address>, onChange: (a: Address) => void }) => {
    const nameChanged = (name) => onChange({ ...getCurrentValue(address), name })
    return <div>
        <TextInput value={address.map(a => a.name)} onChange={nameChanged}>
    </div>
}
```

Still it feels clumsy and gets dirtier when you have more fields in your AddressEditor. This is where atoms and lenses come handy. An Atom represents a two-way interface to data: it extends Bacon.Property and adds a `set` method for changing the value. Hence it's a very convenient abstraction for editing stuff. Let's change our TextInput to

```
import { Atom } from "harmaja"
const TextInput = ({value}: {text: Atom<string>}) => {
    return <input value={text} onInput={e => text.set(e.target.value)} />
}
```

This is the full implementation. Now we can change AddressEditor to this:

```
const AddressEditor = ({ address } : { address : Atom<Address> }) => {
    return <div>
        <TextInput value={address.view("name")}>
        <TextInput value={address.view("addressLine1")}>
    </div>
}
```

And that's also the full implementation! I hope this demonstrates the power of the Atom abstraction. The `view` method there is particularly interesting (I redacted methods and the support for array keys for brevity):


```
export interface Atom<A> extends B.Property<A> {
    set(newValue: A): this;
    get(): A
    view<K extends keyof A>(key: K): Atom<A[K]>    
}
```

Using `view` you can get another atom that gives read-write access to one field of Address and done this in a type-safe manner (compiler errors in case you misspelled a field name). Now, to use AddressEditor as a standalone component you can just

```
    const address: Atom<Address> = atom({name: "", addressLine1: ""})
    <AddressEditor address={address}>
```

And it's turtles all the way down btw. You can define your full application state as an Atom and them `view` your way into details. Like

```
    const appState = atom({ shippingAddress: { name: "", addressLine1: ""}})
    <AddressEditor address={appState.view("shippingAddress")}>
```

To plug an Atom editor (pun intended) into a Unified data flow system, I have introduced Dependent Atom. In the AddressEditor case you may want to use the editor for editing a shipping address that's actually stored in the reducer-based global state. Let's imagine we had a event/reducer setup like this:

```
const setShippingAddress = new B.Bus<Address>()
const orderState = B.update( 
    { shippingAddress: { name: "", addressLine1: "" }},
    [ setShippingAddress, (state, shippingAddress) => ({ ...state, shippingAddress }]
)
```

Now to create a component that allows editing of an address and finally sends that to global state you could do

```
const OrderForm = () => {
    const shippingAddress: B.Property<Address> = orderState.map(s => s.shippingAddress)
    const address: Atom<Address> = atom(shippingAddress, address => setShippingAddress.push(address))
    return <form>
        <AddressEditor address={address}>
    </form>
}
```

The `atom(property, onChange)` call creates an atom that reflects the value of the given property and passes and value changes to the given function. It acts as a convenient bridge between global state and atom-based editors.

## Arrays

Efficient and convenient way of working with arrays of data is a necessary step to success. In Harmaja, there's a `ListView` for just that. 

Imagine again you're building a Todo App (who isnt'!). Your model and state is essentially this.

```
type TodoItem = {
    name: string,
    id: number,
    completed: boolean
}
const addItemBus = new B.Bus<TodoItem>();
const removeItemBus = new B.Bus<TodoItem>();
const allItems: B.Property<TodoItem[]> = B.update([], 
    [addItemBus, (items, item) => items.concat(item)],
    [removeItemBus, (items, item) => items.filter(i => i.id !== item.id)]
)
```

To render the TodoItems represented by the `allItems` property you can use ListView thus:

```
<ListView 
    observable={allItems} 
    renderObservable={ (item: B.Property<TodoItem>) => (
        <ItemView item={item}/>
    )}
    equals={(a: TodoItem, b: TodoItem) => a.id === b.id}
/>

const ItemView = ({ item }: { item: B.Property<TodoItem> }) => {
    // implement view for individual item
}
```

What ListView does here is that it observes `allItems` for changes and renders each item using the ItemView component. When the list of items changes (something is replaced, added or removed) it uses the given `equals` function to determine whether to replace individual item views. With the given `equals` implementation it replaces views only when the `id` field doesn't match. Each item view gets a `Property<TodoItem>` so that they can update when the content in that particular TodoItem is changed. See full implementation in [examples/todoapp/index.ts](examples/todoapp/index.ts).

ListView also supports read-write access using `Atom`. So if you have

```
const allItems: Atom<TodoItem[]> = atom([])
```

You can have read-write access to the items by using ListView thus:

```
<ListView 
    atom={items} 
    renderAtom={(item, removeItem) => {
        return <li><ItemView {...{item, removeItem}}/></li>          
    }}
    equals={(a, b) => a.id === b.id}
/>
```

As you can see ListView provides a `removeItem` callback for Atom based views, so that in your ItemView you can implement removal simply thus:

```
const Item = ({ item, removeItem }: { item: Atom<TodoItem>, removeItem: () => void }) => (
    <span>
      <span className="name">{item.view("name")}</span>      
      <a onClick={removeItem}>
        remove
      </a>
    </span>
  )
```

This item view implementation only gives a readonly view with a remove link. To make the name editable, you could now easily use the TextInput component we created earlierly:

```
const Item = ({ item, removeItem }: { item: Atom<TodoItem>, removeItem: () => void }) => (
    <span>
      <TextInput value={item.view("name")} />
      <a onClick={removeItem}>
        remove
      </a>
    </span>
  )
```

See the full atomic implementation of TodoApp in [examples/todoapp-atoms/index.ts](examples/todoapp-atoms/index.ts).

There's a third variation of TextView still, for read-only views:

```
<ListView 
    observable={items} 
    renderItem={(item: TodoItem) => <li><Item item={item}/></li>}
    equals={(a, b) => a === b}
/>
```

So if you provide `renderItem` instead of `renderObservable` or `renderAtom`, you can use a view that renders a plain TodoItem. This means that the item view cannot react to changes in the item data and simply renders the static data it is given. In this case, you'll need to supply a "content equality" kind of `equals` method so that the ListView knows to replace the ItemView when the data inside the item is changed.

In fact, I should rename equals to make a clear distinction between "id equality" and "content equality". Suggestions?

## Cool FRP things

TODO. Dealing with asynchronicity. For example request/response. Debounce. Flatmaplatest.

## Status

This is an experimental library. I have no idea whether it will evolve into something that you would use in production. Feel free to try and contribute though! I'll post the crucial shortcomings as Issues.

Next challenge:

- JSX typings, including allowing Properties as attribute values. Currently using React's typings which are not correct and cause compiler errors which require using `any` here and there

More work
- Support list of elements as render result
- Remove the `span` wrapper from smartarray
- Render directly as DOM elements instead of creating VDOM (when typings are there)
