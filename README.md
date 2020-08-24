# Harmaja

An experimental web frontend framework named after a lighthouse. It maybe easiest to describe it in contrast to React. 

- Uses JSX syntax just like React
- Function components only
- Component function is treated like a *constructor*, i.e. called just once per component lifecycle
- Dynamic content passed to components as observable properties
- Directly embed Observables in JSX, resulting to "surgical" DOM updates
- Written in Typescript. Type-safety considered a high priority.
- Uses Bacon.js for observables at the moment (includes its own Atom implementation)
- Strongly inspired by [Calmm.js](https://github.com/calmm-js/documentation/blob/master/introduction-to-calmm.md). If you're familiar with Calmm, you can think of Harmaja as "Calmm, but with types and no React dependency

Published on NPM: https://www.npmjs.com/package/harmaja

The documentation here is lacking, and it will help if you're already familiar with Redux, Calmm.js and Bacon.js (or other reactive library such as RxJs).

This document contains a lot of discussion on state management concepts such as unidirectional data flow, as well as existing implementations that I'm aware of. 
I present my views on these topics openly, with the goal to paint the whole picture of how I see application state management. So don't expect this to be a focused
API document, but more like a research project. I'm very open to discussion and criticism so correct me if I'm wrong. On the other hand, I hope you to understand
that many topics here are subjective and I'm presenting my own views of the day.

## Usage

Install from NPM `npm install harmaja` or `yarn add harmaja`.

Tweat your tsconfig.json for the custom JSX factory.

```json
{
  "compilerOptions": {
    // ...
    "jsx": "react",
    "jsxFactory": "h"
  }
  // ...
}
```

## Key concepts

[*Reactive Property*](https://baconjs.github.io/api3/classes/property.html) (also known as a signal or a behaviour) is an object that encapsulates a changing value. Please check out the [Bacon.js intro](https://baconjs.github.io/api3/index.html) if you're not familiar with the concept. In Harmaja, reactive properties are the main way of storing and passing application state.

[*EventStream*](https://baconjs.github.io/api3/classes/eventstream.html) represents a stream of events that you can observe by calling its `forEach` method. In Bacon.js a *Bus* is an EventStream that allows you to `push` events to the stream as well as observe events. In Harmaja, buses are used for conveying distinct events from the UI to state reducers.

*Atom* is a Property that also allows mutation using the `set` methods. You can create an atom simply by `atom("hello")` and then use `atom.get` and `atom.set` for viewing and mutating its value. May sound underwhelming, but the Atom is also a reactive property, meaning that it's state can be observed and *reacted*. In Harmaja particularly, you can embed atoms into your VDOM so that your DOM will automatically reflect the changes in their value! Furthermore, you can use `atom.view("attributename")` to get a new Atom that represents the state of a given attribute within the data structure wrapped by the original Atom. Currently Harmaja comes with its own Atom implementation.

*State decomposition* means selecting a part or a slice of a bigger state object. This may be familiar to you from Redux, where you `mapStateToProps` or `useSelector` for making your component *react* to changes in some parts of the application state. In Harmaja, you use reactive properties or Atoms for representing state and then select parts of it for your component using `property.map` or `atom.view`, the latter providing a read-write interface.

*State composition* is the opposite of the above (but will co-operate nicely) and means that you can compose state from different sources. This is also a familiar concept from Redux, if you have ever composed reducers. 

You can very well combine the above concepts so that you start with several state atoms and event streams, then compose them all into a single "megablob" and finally decompose from there to deliver the essential parts of each of your components.

## Examples

Part of my process has been validating my work with some examples I've previously used for the comparison of different React state management solutions. 

First, let's consider a TODO app. See the [examples/todoapp](examples/todoapp/index.tsx). I've added some annotations. In this example, application state is reduced from different events (add/remove/complete todo item).

Then there's the same application using Atoms [examples/todoapp-atoms](examples/todoapp-atoms/index.tsx). It's rather less verbose, because with Atoms, you can decompose and manipulate substate directly using `atom.set` instead using events and reducers.

Finally a bit more involved example featuring a "CRM": [examples/consultants](examples/consultants/index.tsx). It features some harder problems like dealing with asynchronous (and randomly failing!) server calls as well as edit/save/cancel.

Examples covered also in the chapters below, with some context.

## Unidirectional data flow

Unidirectional data flow, popularized by Redux, is a leading state management pattern in web frontends today. In short, it means that you have a (usually essentially) global data *store* or stores that represent pretty much the entire application state. Changes to this state are not effected directly by UI components but instead by dispacthing *events* or *actions* which then are processed by *reducers* and applied to the global state. The state is treated as an immutable object and every time the reducers applies a new change to state, it effectively creates an entire new state object. 

In Typescript, you could represent these concepts in the context of a Todo App like this:

```typescript
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

## Unidirectional data flow with Harmaja

In Harmaja, you can implement Unidirectional data flow too. Sticking with the Todo App example, you define your events as [*buses*](https://baconjs.github.io/api3/classes/bus.html):

```typescript
import * as B from "baconjs"

const addItemBus = new B.Bus<TodoItem>();
const removeItemBus = new B.Bus<TodoItem>();
```

The bus objects allow you to dispatch an event by calling their `push` method. From the events, the application state can be reduced using [`B.update`](https://baconjs.github.io/api3/globals.html#update) like thus:

```typescript
const allItems: B.Property<TodoItem[]> = B.update([], 
    [addItemBus, (items, item) => items.concat(item)],
    [removeItemBus, (items, item) => items.filter(i => i.id !== item.id)]
)
```

You can, if you like, then encapsulate all this into something like

```typescript
interface TodoStore {
    add: B.Bus<TodoItem>()
    remove: B.Bus<TodoItem>()
    items: B.Property<TodoItem[]>
}
```

...so you have an encapsulation of this piece of application state, and you can pass this store to your UI components.

A notable difference in this store setup to Redux is, that there are no action creators and reducers per se. 
You define distinct events and derive state from them. 
You can also define the buses and the derived state properties in your components if you want to have scoped state. 
There is no such thing as *react context* in Harmaja, so everything has to be passed explicitly or defined in a global scope, at least for now. 

## From store to view

In unidirectional data flow setups, there's always a way to reflect the store state in your UI. For instance,

- In [react-redux](https://github.com/reduxjs/react-redux) you can use the `useSelector` hook for extracting the parts of global state your component needs
- In Elm and Cycle.js the whole state is always rendered from the root and you trust the framework to be effient in VDOM diffing

Pretty soon after React started gaining popularity, my colleagues at Reaktor (and I later) started using a "Bacon megablob" architecture where events and the "store" are
defined exactly as in the previous chapter, using Buses and a state Property. Thanks to React's relatively good performance with VDOM and diffing, 
it's in most cases a viable choice. Sometimes though, it may prove too heavy to render everything everytime. If you have a "furry" (wide and deeply nested) data model,
doing a full render on every keystroke just might not work. This has caused pain and various optimizations (often involving local state) have been written.

However, it may make more sense to adopt the `useSelector`-like approach and instead of rendering the whole VDOM on all changes, 
listen to relevant changes in your components and render on change. I wrote about one React Hooks based approach on the 
[Reaktor blog](https://www.reaktor.com/blog/make-react-reactive-by-using-hooks/) earlierly.

Now if we consider the case of Harmaja, the situation is different from any React based approaches. First of all, Harmaja doesn't have VDOM diffing or Hooks. But the
fact that you can pass reactive properties as props fits the bill very nicely, so in the case of a TodoItem view, you can

```typescript
import { React, mount } from "../.."

const ItemView = ({ item }: { item: B.Property<TodoItem> }) => {  
  return (
    <span>
      <span className="name">{item.map(i => i.name)}</span>      
    </span>
  );
};
```

The first big difference to Redux is that instead of asking for stuff from the global state in your component implementation, you actually require the relevant data
in the function signature (how revolutionary!). This rather obviously makes the component easier to reason about, use in different context, test and so on. So just from
the function signature you can easily decuce that this component will render a TodoItem and reflect any changes that are effected to that particular TodoItem (because
the input is a reactive property).

In the implementation, the [`map`](https://baconjs.github.io/api3/classes/property.html#map) method of the `Property<TodoItem>` is used to get a `Property<string>` which 
then can be directly embedded into the resulting DOM,
because Harmaja natively renders Properties. When the value of `name` changes, the updated value will be applied to DOM.

Think: *you can pick a part of your Store and use it as a Store*. This removes the need for the component to *know where the data is* in the global store. 
In react-redux all components that actually *react* to store changes, need to know the "location" of their data in the store to be able to get it using `useSelector`.
In contrast using the Property abstraction you can easily [`map`](https://baconjs.github.io/api3/classes/property.html#map) out the data from the store and give a handle to your components.

Another big difference is that store data and local data are the same. No separate mechanism for dealing with local state. Instead, you can declare more Properties in
your component constructors as you go, to flexibly define data stores at different application layers. Which arguably makes it easier to make changes too, as you don't
need to change the mechanism when moving from local to global. More on this topic below.

Anyway, let's put the Todo App together right now! To simplify a bit, if were were just rendering the first TodoItem (There's a chapter on array rendering down there), the root element of the application could look like this:

```typescript
const App = () => {
    const firstItem: Property<TodoItem> = allItems.map(items => items[0])
    return <ItemView item={firstItem}/>
}
```

Then you can mount it and it'll start reacting to changes in the store:

```typescript
mount(<App/>, document.getElementById("root")!)
```

Although I prefer components that get all of their required inputs in their constructor (this is called dependency injection), there's nothing to prevent you from
accessing global "stores" from your components as well. 

See the full Todo App example [here](examples/todoapp/index.tsx).


## Composable read and write

So it's easy to *decompose* data for viewing so that you can *compose* your application out of components.
But what about writes? Do they compose too? It would certainly be nice not to have to worry about every single
detail in the high level "main reducer". Instead I find it an attractive idea to deal on a higher abstraction level.

Let's try! It's intuitive to start with this:

```typescript
updateTodoItem: B.Bus<TodoItem>()
todoItems: B.Property<TodoItem[]> // impl redacted
```

So instead of having to care about all the possible modifications to items on this level, there's a single `updateTodoItem` event that can be used to perform any update.

As shown earlierly, decomposition works nicely as you can call `item.map(i => i.someField)` to get views into its components parts.
Now let's revisit ItemView from the previous section and add a `onUpdate` callback.

```typescript
import { React, mount } from "../.."

const ItemView = ({ item, onChange}: { item: B.Property<TodoItem>, onChange: (i: TodoItem) => void }) => {  
  const onNameChange = (newName: string) => { /* wat */ }
  return (
    <span>
      <TextInput text={ item.map(i => i.name) } onChange = { onNameChange } />
    </span>
  );
};

const TextInput = ({value, onChange}: {text: B.Property<string>, onChange: (s: string) => void}) => {
    return <input value={text} onInput={ e => onChange(e.currentTarget.value) } />
}
```

I added an simple TextInput component that renders the given `Property<string>` into an input element and calls
its `onChange` listener. Yes, with Harmaja, you can embed reactive properties into DOM element props just like that.
Now the question is, how to implement `onNameChange`, as well as the myriad similar functions you may need in your 
more complex applications.

The tricky thing is that in the `onNameChange` function you don't really have the current full TodoItem at hand. 
Instead you have a `Property<TodoItem>` which does not provide a method for extracting its current value.
The [reason](https://github.com/baconjs/bacon.js/wiki/FAQ#how-do-i-get-the-latest-value-of-a-property) for this omission is that reactive properties are meant to be used in a reactive manner, i.e. by subscribing
to them. If you don't subscribe, the property isn't necessarily kept up to date with its underlying data source.

Yet, in this case we *know* that the property has a value and is active (the TextInput is subscribing to it to reflect
changes). So we can use a little hack, which is the `getCurrentValue` function used by Harmaja under the hood for
being able to render observables synchronously, and which it generously exports as well. So we can do this:

```typescript
  const onNameChange = (newName: string) => { 
      onChange({ ...getCurrentValue(item), name: newName })
  }
```

So it's fully doable: you can use a higher level of abstraction in the top-level reducer and deal with individual field 
updates in "mid-level" components such as the ItemView.

Yet, it's far from elegant especially if you've ever worked with Atoms and Lenses with Calmm.js. Read on.

## Welcome to the Atom Age

So you're into decomposing read-write access into data. This is where atoms come handy. 
An `Atom<A>` simply represents a two-way interface to data by extending [`Bacon.Property<A>`](https://baconjs.github.io/api3/classes/property.html) and adding 
a `set: (newValue: A)` method for changing the value. Let's try it by changing our TextInput to

```typescript
import { Atom, atom } from "harmaja"
const TextInput = ({value}: {text: Atom<string>}) => {
    return <input value={text} onInput={e => text.set(e.currentTarget.value)} />
}
```

This is the full implementation. Because Atom encapsulates both the view to the data (by being a Property) 
and the callback for data update (through the `set` method), it can often be the sole prop an "editor" component needs. 
To create an Atom in our unidirectional data flow context, we can simply construct it from a `Property` and a `set` function
like so:

```typescript
const ItemView = ({ item, onChange}: { item: B.Property<TodoItem>, onChange: (i: TodoItem) => void }) => {  
  const itemAtom: Atom<TodoItem> = atom(item, updated => updateItemBus.push(updated))
  return (
    <span>
      <TextInput value={itemAtom.view("name")} />
    </span>
  );
};
```

And that's also the full implementation! I hope this demonstrates the power of the Atom abstraction. The `view` method there is particularly interesting (I redacted methods and the support for array keys for brevity):


```typescript
export interface Atom<A> extends B.Property<A> {
    set(newValue: A): this;
    get(): A
    view<K extends keyof A>(key: K): Atom<A[K]>    
}
```

Using `view` you can get another atom that gives read-write access to one field of ther TodoItem and done this in a type-safe manner (compiler errors in case you misspelled a field name). 

Finally, we have an abstraction that makes read-write data decomposition a breeze! Adding more editable fields is no longer a chore. And all this still with unidirectional data flow, immutable data and type-safety.

The `view` method is actually based on the Lenses that's a concept been used in the functional programming world for quite a while. Yet, I haven't heard much talk about using Lenses in web application state management except for Calmm.js and before that the [Bacon.Model](https://github.com/baconjs/bacon.model) library. I could rant about lenses all night long but for now, I'll show you the full signature of the `view` method:

```typescript
export interface Atom<A> extends B.Property<A> {
    // ...
    view<K extends keyof A>(key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>,
    view<B>(lens: L.Lens<A, B>): Atom<B>,
    // ...
}
```

It reveals two things. First, it supports numbers for accessing array elements. But most importantly, you can create a view to an
Atom with an arbitrary Lens. Which a really simple abstraction:

```typescript
export interface Lens<A, B> {
    get(root: A): B
    set(root: A, newValue: B): A
}
```

But let's move on.

## Local state

So far, it's all been about Unidirectional Data Flow when there's a single source of truth which is a single reactive Property
that's reduced from one or more events streams. Yet sometimes it makes sense to use some local state too. 
That's when standalone Atoms come into play.

To use our ItemView as a standalone component you can change it to use the Atom interface just like the lower level TextInput component:

```typescript
    const ItemView = ({ item }: { item: Atom<TodoItem> }) => {  
        return (
            <span>
            <TextInput value={item.view("name")} />
            </span>
        );
    };
```

and use it in your App like this:

```typescript
    const App = () => {
        const item: Atom<TodoItem> = atom({id:1, name:"do stuff", completed:false})
        return <ItemView item={item}/>
    }    
```

See, I created an independent Atom in the App component. It's practically local state to App now. Remember that in Harmaja, just like with Calmm.js, 
component functions are to be treated like constructors. This means that the local variables created in the function
will live as long as the component is mounted, and can thus be used for local state (unlike in React where they would be re-ininitialized on every VDOM render).

That's all there is to local state in Harmaja, really. State can be defined globally, or in any level of the component tree. When you
use Atoms, you can define them locally or accept them as props. You can even add a fallback:

```typescript
    const ItemView = ({ item }: { item: Atom<TodoItem> = atom(emptyTodoItem) }) => {  
        ///
    };
```

This component could be used with an external atom (often a view into a larger chunk of app state) or without it, in which case
it would have it's private state.

And it's turtles all the way down by the way. You can define your full application state as an Atom and them `view` your way into details. 
An example of fully Atom-based application state can be seen at [examples/todoapp-atoms](examples/todoapp-atoms/index.tsx).

## Arrays

Efficient and convenient way of working with arrays of data is a necessary step to success. When 
there's a substantial number of items (say 1000) of some substantial complexity, performance is not trivial
anymore. 

React VDOM diffing will get its users to some point, but when that's not enough, you'll need to
make sure that frequent operations (change to a single item, append new item, depends on use case) do not force 
the full array VDOM to be re-rendered. This is fully possible with, for instance, react-redux: just make sure the
component that renders the array doesn't re-render unless array size changes.

In Harmaja, there's no VDOM diffing so relying on that is not an option. Therefore, a perfomant and ergonomic array view is key. So, I've included a `ListView` component for just that. 

Imagine again you're building a Todo App again (who isnt'!) and you have the same data model that was introduced in the
"Unidirectional data flow" chapter above. To recap, it's this.

```typescript
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

```typescript
<ListView 
    observable={allItems} 
    renderObservable={ (item: B.Property<TodoItem>) => (
        <ItemView item={item}/>
    )}
    key={(a: TodoItem) => a.id }
/>

const ItemView = ({ item }: { item: B.Property<TodoItem> }) => {
    // implement view for individual item
}
```

What ListView does here is that it observes `allItems` for changes and renders each item using the ItemView component. 
When the list of items changes (something is replaced, added or removed) it uses the given `key` function to determine 
whether to replace individual item views. With the given `key` implementation it replaces views only when the `id` field doesn't match, 
i.e. the view no longer represents the same item. Each item view gets a `Property<TodoItem>` so that they can update when the content 
in that particular TodoItem is changed. See full implementation in [examples/todoapp](examples/todoapp/index.ts).

ListView also supports read-write access using `Atom`. So if you have

```typescript
const allItems: Atom<TodoItem[]> = atom([])
```

You can have read-write access to the items by using ListView thus:

```typescript
<ListView 
    atom={items} 
    renderAtom={(item, removeItem) => {
        return <li><ItemView {...{item, removeItem}}/></li>          
    }}
    key={ a => a.id }
/>
```

As you can see ListView provides a `removeItem` callback for Atom based views, 
so that in your ItemView you can implement removal simply thus:

```typescript
const Item = ({ item, removeItem }: { item: Atom<TodoItem>, removeItem: () => void }) => (
    <span>
      <span className="name">{item.view("name")}</span>      
      <a onClick={removeItem}>
        remove
      </a>
    </span>
  )
```

This item view implementation only gives a readonly view with a remove link. 
To make the name editable, you could now easily use the TextInput component we created earlierly:

```typescript
const Item = ({ item, removeItem }: { item: Atom<TodoItem>, removeItem: () => void }) => (
    <span>
      <TextInput value={item.view("name")} />
      <a onClick={removeItem}>
        remove
      </a>
    </span>
  )
```

See the full atomic implementation of TodoApp in [examples/todoapp-atom](examples/todoapp-atoms/index.ts).

There's a third variation of TextView still, for read-only views:

```typescript
<ListView 
    observable={items} 
    renderItem={(item: TodoItem) => <li><Item item={item}/></li>}
/>
```

So if you provide `renderItem` instead of `renderObservable` or `renderAtom`, you can use a view that renders a plain TodoItem. 
This means that the item view cannot react to changes in the item data and simply renders the static data it is given. 

## Component lifecycle

When components subscribe to data sources, it's vital to unsubscribe on unmount to prevent resource leaks.

In traditional React, you used the component lifecycle methods [`componentDidMount`](https://reactjs.org/docs/react-component.html#componentdidmount) and `componentWillUnmount` to subscribe and unsubscribe. 
This kind of manual resource management is, based on my experience, very error-prone. 
The [`useEffect`](https://reactjs.org/docs/hooks-effect.html) hook gives better tools for the job. 
Still, you have to *remember* to return a cleanup function (see [example](https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1)). 
When dealing with data sources such as Observables, Promises or the Redux Store, it's better to use a higher level of abstract to avoid doing cleanup manually. 
And, because all of them are in fact generic abstractions, you can
build/steal/borrow generic utilities for this. The [`useSelector`](https://react-redux.js.org/api/hooks#useselector) hook in react-redux is a good example: it gives you the data you need
without bothering you with cleanup. Similarly you can build hooks for dealing with Observables as I discovered in my [blog post](https://www.reaktor.com/blog/make-react-reactive-by-using-hooks/) in 2018.

In Harmaja, there are no hooks. State management is built on Observables and subscriptions to observables are managed automatically based on component lifecycle. Details follow!

As told above, components in Harmaja are functions that are treated as constructors. The return value of a Harmaja component
is actually a native [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement).

When you embed observables into the DOM, Harmaja creates a placeholder node (empty text node) into the DOM tree and replaces it with
the real content when the observable yields a value. If the value is yielded synchronously, the placeholder is unnecessary and is not created. 
Whenever it subscribes to an observable, it attachs the resultant *unsub* function to the created DOM node so that it can
perform cleanup later. 

When Harmaja replaces any DOM node, it recursively seeks all attached *unsubs* in the node and its children and calls them to free
resources related to the removed nodes.

In addition, all observables passed as props to Harmaja components are automatically scoped to component lifecycle. Practically
Harmaja checks for props that are EventStreams or Properties (but not Buses or Atoms) and instead of passing the `observable` as-is,
it passes [`observable.takeUntil(unmountEvent())`](https://baconjs.github.io/api3/classes/property.html#takeuntil) to the component constructor.

The only case where you need to be more careful is when your subscribing from a component directly to an external/global source,
as this is not something that Harmaja can magically manage. When doing this you can use either the `unmountEvent()` eventstream
or the `onUnmount` callback to make sure your subscriptions don't exceed component lifetime.

## Promises and async requests

I don't think a state management solution is complete until it has a strategy for dealing with asynchronous requests, typically
with Promises. Common scenarios include

- Fetching extra data from server when mounting a component. Gets more complicated if you need to re-fetch in case some componnent prop changes
- Fetching data in response to a user action, i.e. the search scenario. This boils down the first scenario if you have a SearchResults component that fetches data in response to changed query string
- Storing changed data to server. Complexity arises from the need to disable UI controls while saving, handling errors gracefully etc. Bonus points for considering whether this is a local or a global activity - and where should the transient state be stored.

In Harmaja, reactive Properties and EventStreams are used for dealing with asynchrous requests. Promises can be conveniently wrapped in. Let's have a look at an example.

### The search example

Let's consider the search example. Starting from SearchResults component, it might look like this:

```typescript
type SearchState = { state: "initial" } | { state: "searching", searchString: string } | { state: "done", results: string[], searchString: string }

const SearchResults = ({ state } : { state: B.Property<SearchState> }) => {
    // ?
}

```

I didn't want to make this too simple, because simple things are always easy to do. In this case, we want to

- Show the results if any
- Show "nothing found" in case the result is an empty array
- Show an empty component in case there's nothing to show (state=initial)
- Show "Searching..." when search is in progress, or show previous search results with `opacity:0.5` in case there are any

For starters we might try a simplistic approach:

```typescript
const SearchResultsSimplest = ({ state } : { state: B.Property<SearchState> }) => {
    const currentResults: B.Property<string[] | null = state.map(s => s.state === "done" ? s.results : null)
    const message: B.Property<string> = currentResults.map(r => r.length === 0 ? "Nothing found" : null)
    
    return <div>
        { message }
        <ul><ListView
            observable={currentResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>
    </div>
}
```

The list of result and a message string are derived from the state using [`.map`](https://baconjs.github.io/api3/classes/property.html#map) (state decomposition in action).
Then we can easily include the "Searching" indicator using the same technique. But showing previous results while 
searching requires some local state, because that's not incluced in `state`. Fortunately, reactive properties provide
good tools for this. For instance,

```typescript
const currentResults: B.Property<string[] | null = state.map(s => s.state === "done" ? s.results : null)
const latestResults: B.Property<string[]> = currentResults.filter(results => results !== null).startWith([])
```

Here `latestResults` will reflect `currentResults` except that, using [`filter`](https://baconjs.github.io/api3/classes/property.html#filter), 
it skips states where there are no results, sticking with the previous results in those situations. The [`startWith([])`](https://baconjs.github.io/api3/classes/property.html#startwith) 
sets an initial value to be used before any (non-null) value passes the filter.

Then we can determine the message string to show to the user, based on state and currently shown results:

```typescript
const message = B.combineWith(state, latestResults, (s, r) => {
    if (s.state == "done" && r.length === 0) return "Nothing found"
    if (s.state === "searching" && r.length === 0) return "Searching..."
    return ""
})
```

Here the [`B.combineWith`](https://baconjs.github.io/api3/globals.html#combinewith) method creates a new Property that reflects the latest values from the given two properties (state, latestResults) and
applies the given mapping function to the values.

The `opacity:0.5` style can be applied similarly using [`B.combineWith`](https://baconjs.github.io/api3/globals.html#combinewith) and the final SearchResults component looks like this:

```typescript
const SearchResults = ({ state } : { state: B.Property<SearchState> }) => {
    const currentResults: B.Property<string[] | null> = state.map(s => s.state === "done" ? s.results : null)
    const latestResults: B.Property<string[]> = currentResults.filter(results => results !== null).startWith([])

    const message = B.combineWith(state, latestResults, (s, r) => {
        if (s.state == "done" && r.length === 0) return "Nothing found"
        if (s.state === "searching" && r.length === 0) return "Searching..."
        return ""
    })
    const style = B.combineWith(state, latestResults, (s, r) => {
        if (s.state === "searching" && r.length > 0) return { opacity: 0.5 }
        return {}
    })
    
    return <div>
        { message }
        <ul style={ style }><ListView
            observable={ latestResults }
            renderItem={ result => <li>{result}</li>}
        /></ul>

    </div>
}
```

But this was supposed to be about dealing with asynchronous requests! Let's get to the main Search component now.

```typescript
declare function search(searchString: string): Promise<string[]> // implement using fetch()
function searchAsEventStream(searchString: string): B.EventStream<string[]> {
    return B.fromPromise(search(searchString))
}
const Search = () => {
    const searchString = atom("")
    const searchStringChange: B.EventStream<string> = searchString.changes()
    const searchResult: B.EventStream<string[]> = searchStringChange.flatMapLatest(searchAsEventStream)
    const state: B.Property<SearchState> = B.update(
        { state: "initial"} as SearchState,
        [searchStringChange, (state, searchString) => ({ state: "searching", searchString })],
        [searchResult, searchString, (state, results, searchString) => ({ state: "done", results, searchString})]
    )
    return <div>
        <h1>Cobol search</h1>
        <TextInput value={searchString} placeholder="Enter text to start searching"/>
        <SearchResults state={state} />
    </div>
}
```

Lots of interesting details above! First of all, I started with an Atom to store the current `searchString`. Then I plugged
the earlierly defined `TextInput` in place.

The actual `search` function is dedacted and could be easily implemented using Axios or fetch. I added a simple wrapper `searchAsEventStream`
that returns search results a `EventStream` instead of a `Promise`. This is easy using [`B.fromPromise`](https://baconjs.github.io/api3/globals.html#frompromise).

The `searchResult` EventStream is created using [`flatMapLatest`](https://baconjs.github.io/api3/classes/eventstream.html#flatmaplatest) 
which spawns a new stream for each input event using the `searchAsEventStream`
helper and keeps on listening for results from the latest created stream (that's where the "latest" part in the name comes from).

Then I've introduced a reducer, once again using [`B.update`](https://baconjs.github.io/api3/globals.html#update), and come up with the state property. 
This setup is now local to the Search component,
but could be moved into a separate store module if it turned out that it's needed in a larger scope.

One more notice: on the last line of the reducer, I've included an extra parameter, i.e. the searchString property. This is a convenient way
to plug the latest value of a Property into the equation in a reducer. In each of the patterns in `B.update` you should have one EventStream and
zero or more Properties. Only the EventStream will trigger the update; Properties are there only so that you can use their latest value in the equation.

One common pattern in searching is throttling (or debouncing). You don't want to send a potentionally expensive query to your server on each keystroke.
When using Bacon.js, you can choose between [`debounce`](https://baconjs.github.io/api3/classes/eventstream.html#debounce), 
[`debounceImmediate`](https://baconjs.github.io/api3/classes/eventstream.html#debounceimmediate) and [`throttle`](https://baconjs.github.io/api3/classes/eventstream.html#throttle).

To use a 300 millisecond debounce, the change looks like this:

```typescript
    const searchStringChange: B.EventStream<string> = searchString.changes().debounce(500)
```

See the full search implementation at [examples/search](examples/search/index.tsx).

More dealing with async request at [examples/consultants](examples/consultants/index.tsx).

## Detaching and syncing state

TODO: study on buffering local changes until commit / cancel

Covered in [examples/todoapp-backend](examples/todoapp-backend/index.jsx).

## Category theory view

TODO this is a nice opportunity to introduce some Category theoretic concepts as well

Functor (Co-variant) for state Decomposition read-only
Contravariant functor for state Decomposition write-only
Applicative functor for state Composition
Profunctors for lenses
Monads?

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


## Status

This is an experimental library. I have no idea whether it will evolve into something that you would use in production. Feel free to try and contribute though! I'll post the crucial shortcomings as Issues.

Next challenge:

- JSX typings, including allowing Properties as attribute values. Currently using React's typings which are not correct and cause compiler errors which require using `any` here and there

More work
- Support list of elements as render result
- Remove the `span` wrapper from smartarray
- Render directly as DOM elements instead of creating VDOM (when typings are there)
