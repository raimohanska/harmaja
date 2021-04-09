<h1><img alt="Harmaja" src="logo/harmaja-logo.svg" width="200"></h1>

[![Join the chat at https://gitter.im/harmaja](https://badges.gitter.im/harmaja.svg)](https://gitter.im/harmaja/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An experimental web frontend framework named after a lighthouse. It maybe easiest to describe it in contrast to React.

-   Uses JSX syntax just like React
-   Function components only
-   Component function is treated like a _constructor_, i.e. called just once per component lifecycle
-   Dynamic content passed to components as observable properties
-   Directly embed Observables in JSX, resulting to "surgical" DOM updates. No VDOM diffing needed.
-   Written in Typescript. Type-safety considered a high priority.
-   Support [Lonna](https://github.com/raimohanska/lonna), [Bacon.js](https://baconjs.github.io/) and [RxJs](https://rxjs-dev.firebaseapp.com/) for observables at the moment. You can select the desired library by imports (see below).
-   Strongly inspired by [Calmm.js](https://github.com/calmm-js/documentation/blob/master/introduction-to-calmm.md). If you're familiar with Calmm, you can think of Harmaja as "Calmm, but with types and no React dependency

Published on NPM: https://www.npmjs.com/package/harmaja

The documentation here is lacking, and it will help if you're already familiar with Redux, Calmm.js and Bacon.js (or other reactive library such as RxJs).

This document contains a lot of discussion on state management concepts such as unidirectional data flow, as well as existing implementations that I'm aware of.
I present my views on these topics openly, with the goal to paint the whole picture of how I see application state management. So don't expect this to be a focused
API document, but more like a research project. I'm very open to discussion and criticism so correct me if I'm wrong. On the other hand, I hope you to understand
that many topics here are subjective and I'm presenting my own views of the day.

Thanks to [Reaktor](https://reaktor.com) and my lovely co-Reaktorians for the support in the development of this library!

## Key concepts

[_Reactive Property_](https://github.com/raimohanska/lonna/blob/master/src/abstractions.ts#L126) (also known as a signal or a behaviour) is an object that encapsulates a changing value. Please check out the [Bacon.js intro](https://baconjs.github.io/api3/index.html) if you're not familiar with the concept. In Harmaja, reactive properties are the main way of storing and passing application state.

[_EventStream_](https://github.com/raimohanska/lonna/blob/master/src/abstractions.ts#L131) represents a stream of events that you can observe by calling its `forEach` method. A [_Bus_](https://github.com/raimohanska/lonna/blob/master/src/abstractions.ts#L145) is an EventStream that allows you to `push` events to the stream as well as observe events. In Harmaja, buses are used for conveying distinct events from the UI to state reducers.

[_Bus_](https://github.com/raimohanska/lonna/blob/master/src/bus.ts#L5) is an EventStream that allows you to [push](https://github.com/raimohanska/lonna/blob/master/src/bus.ts#L16) new events into it. It is used in Harmaja for defining events that originate from the UI. Typically, an `onClick` or similar handler function pushes a new value into a Bus.

[_Atom_](https://github.com/raimohanska/lonna/blob/master/src/abstractions.ts#L217) is a Property that also allows mutation using the `set` methods. You can create an atom simply by `atom("hello")` and then use `get` and `set` for viewing and mutating its value. May sound underwhelming, but the Atom is also a reactive property, meaning that it's state can be observed and _reacted_. In Harmaja particularly, you can embed atoms into your VDOM so that your DOM will automatically reflect the changes in their value! Furthermore, you can use `view(atom,"attributename")` to get a new Atom that represents the state of a given attribute within the data structure wrapped by the original Atom. Currently Harmaja comes with its own Atom implementation.

_State decomposition_ means selecting a part or a slice of a bigger state object. This may be familiar to you from Redux, where you `mapStateToProps` or `useSelector` for making your component _react_ to changes in some parts of the application state. In Harmaja, you use reactive properties or Atoms for representing state and then select parts of it for your component using [`map`](https://github.com/raimohanska/lonna/blob/master/src/map.ts#L5) or [`view`](https://github.com/raimohanska/lonna/blob/master/src/view.ts#L7), the latter providing a read-write interface.

_State composition_ is the opposite of the above (but will co-operate nicely) and means that you can compose state from different sources. This is also a familiar concept from Redux, if you have ever composed reducers. For example, you can use [`combine`](https://github.com/raimohanska/lonna/blob/master/src/combine.ts#L30) to compose two state atoms into a composite state Property.

You can very well combine the above concepts so that you start with several state Atoms and EventStreams, then compose them all into a single "megablob" Property and finally decompose from there to deliver the essential parts of each of your components.

## Usage

Install from NPM `npm install harmaja` or `yarn add harmaja`.

Tweak your tsconfig.json for the custom JSX factory.

```jsonc
{
    "compilerOptions": {
        // ...
        "jsx": "react",
        "jsxFactory": "h"
    }
    // ...
}
```

In your component code you'll need to import the `h` function from Harmaja like this, so that the TypeScript compiler can use it for creating DOM nodes when you use JSX.

```typescript
import { h } from "harmaja"
```

Then you can start using JSX, creating your application components and mounting them to the DOM.

```tsx
const App = () => <h1>yes</h1>
mount(<App />, document.getElementById("root")!)
```

## Observable Library Selection

You can select the desired Observable library with imports. Currently [Lonna](https://github.com/raimohanska/lonna), [Bacon.js](https://baconjs.github.io/) and RxJs are supported.

### Lonna Observables

To use the default Lonna Observables, install `lonna` from NPM and then:

```typescript
import { h } from "harmaja"
import * as L from "lonna"
```

Lonna includes Atoms and Lenses in addition to Properties, EventStreams and Buses, so you should use `import { atom, Atom } from "lonna"`.

### Bacon.js

To use Bacon.js Observables, install `baconjs` from NPM and then:

```typescript
import { h } from "harmaja/bacon"
import * as L from "baconjs"
```

Bacon.js doesn't include Atoms and Lenses, but Harmaja includes them so you should use `import { atom, Atom } from "harmaja/bacon"`.

Note that you'll need to use the variant in all of your Harmaja imports within your application. Mixing and matching two implementations accross
your application is a very bad idea.

### RxJs

To use RxJs Observables, install `rxjs` from NPM and then:

```typescript
import { h } from "harmaja/rxjs"
import * as Rx from "rxjs"
```

RxJs doesn't include Atoms and Lenses, but Harmaja includes them so you should use `import { atom, Atom } from "harmaja/rxjs"`.

Note that you'll need to use the variant in all of your Harmaja imports within your application. Mixing and matching two implementations accross
your application is a very bad idea.

## API

Here's a brief API description. Read the chapters below for examples and "philosophy".

### Mounting, unmounting and lifecycle events

```typescript
import {
    mount,
    mountEvent,
    onMount,
    onUnmount,
    unmount,
    unmountEvent,
} from "harmaja"
```

Methods documented [here](dist/harmaja.d.ts).

### Refs

With a ref, you can get access to the actual DOM element created by Harmaja, when the element mounted to the DOM.
This is similar to the ref concept in React.

There are two styles of refs available: atom refs and function refs.

To use an atom ref, pass in an atom to the ref prop of the element.
The type of the atom must be a union of null and the type of the dom element matching the harmaja element.
You can use the helper type `RefType<ElementName>` that is exported from Harmaja to automatically determine the correct type for a given element.
When the harmaja element is mounted in the dom, the atom value is set to the dom element.
Note that the atom value will be set to null when the harmaja element it is passed to is constructed, as well as when it is unmounted.
Setting the atom will not have any effect on the dom.

```tsx
const atom = L.atom<RefType<'span'>>(null)
atom.forEach((el) => alert("Mounted " + el))

<span id="x" ref={atom}>
    Hello
</span>
```

To use function refs, pass in a function that takes in a single parameter.
You can use the `DomElementType<ElementName>` type to get the correct type for the function parameter.
When the harmaja element is mounted to the dom, this function will get called with the dom element as the first parameter.

```tsx
<span id="x" ref={(el: DomElementType<"span">) => alert("Mounted " + el)}>
    Hello
</span>
```

### Fragments

Harmaja supports JSX Fragments. This feature requires TypeScript 4 or higher. In your tsconfig.json:

```jsonc
{
    "compilerOptions": {
        // ...
        "jsx": "react",
        "jsxFactory": "h",
        "jsxFragmentFactory": "Fragment"
    }
    // ...
}
```

Then in your component code:

```tsx
import { h, Fragment } from "harmaja"
const App = () => (
    <h1>
        <>
            <span>hello</span>
            <span>world</span>
        </>
    </h1>
)
mount(<App />, document.getElementById("root")!)
```

There are larger examples [here](examples).

### ListView

```typescript
import { ListView } from "harmaja"
```

ListView implements an efficient view into read-only and read-write list data. It supports three different variants. If you have

#### Read-only view to a Property

```typescript
const items: Bacon.Property<A[]>
const renderObservable: (item: Bacon.Property<A>) => ChildNode
const getKey: (item: A) => string
```

Then you can render the items using ListView thus:

```tsx
<ListView
    observable={items}
    renderObservable={renderObservable}
    getKey={getKey}
/>
```

What ListView does here is that it observes `items` for changes and renders each item using the `renderer` function.
When the list of items changes (something is replaced, added or removed) it uses the given `getKey` function to determine
whether to replace individual item views. Each item view gets a `Property<A>` so that they can update when the content
in that particular item is changed. See an example at [examples/todoapp](examples/todoapp/index.ts).

#### Read-write view to an Atom

ListView also supports read-write access using `Atom`. So if you have

```typescript
const items: Atom<A[]>
const renderAtom: (item: Atom<A>, remove: () => void) => ChildNode
const keyFunction: (item: A) => string
```

You can have read-write access to the items by using ListView thus:

```tsx
<ListView atom={items} renderAtom={renderAtom} getKey={keyFunction} />
```

As you can see ListView provides a `removeItem` callback for Atom based views,
so that in your ItemView you can implement item removal by calling this function.

#### Static view

There's a third variation of TextView still, for read-only views:

```tsx
<ListView
    observable={items}
    renderItem={(item: TodoItem) => (
        <li>
            <Item item={item} />
        </li>
    )}
/>
```

In this variant, everything is replaced on any change to the list. Use only for read-only
views into small views of data.

## The rough edges

I'm not entirely happy with the ergonomics of Harmaja+Lonna yet. Here are some of the rough edges.

1. Dealing with polymorphism. See [this example](https://codesandbox.io/s/harmajalonna-obd-tf46t?file=/src/App.tsx), line 51. The explicit cast is nasty. 
2. Lonna type inference, or the lack of thereof. Lonna uses overload signatures and therefore TypeScript type inference cannot keep up when using, for instance, map/filter.

## Pitfalls, be aware!

### Unwanted reloads

My component reloads all the time => make sure you've eliminated duplicates in the Property that you use for switching components.

```tsx
<div>
    { L.view(someProperty, thing => thing.state === "success" ? <HugeComponent/> : <ErrorComponent/> }
</div>
```

In the above, the nested components will be re-constructed each time `someProperty` gets a value. To eliminate duplicate values, do your mapping in two steps, first
extracting the discriminator value and then constructing components, only when
the discriminator changes:

```tsx
<div>
    {L.view(
        someProperty,
        (t) => t.state === "success",
        (success) => (success ? <HugeComponent /> : <ErrorComponent />)
    )}
</div>
```

### Dangling subscriptions

When embedding observables in to the DOM, Harmaja will automatically subscribe an unsubscribe to the source observable. So, this is ok:

```tsx
const scrollPos = L.toStatelessProperty(L.fromEvent(window, "scroll"), () =>
    Math.floor(window.scrollY)
)

const ScrollPosDisplay = () => {
    return (
        <div
            style={{
                position: "fixed",
                right: "20px",
                background: "black",
                color: "white",
                padding: "10px",
            }}
        >
            {
                scrollPos /* This is ok! Harmaja will unsubscribe if the component is unmounted */
            }
        </div>
    )
}
```

When this component is unmounted, it will stop listening to updates in the global scrollPos property. But you are in trouble if you want
to add some side-effect to scrollPos, like:

```typescript
const ScrollPosDisplay = () => {
    scrollPos.forEach((pos) => console.log(pos))
    // ...
}
```

Now this side-effect will continue executing after your component is unmounted. To fix this, you can scope it to component lifecycle like this:

```typescript
import { unmountEvent } from "harmaja"

const ScrollPosDisplay = () => {
    scrollPos
        .pipe(L.applyScope(componentScope()))
        .forEach((pos) => console.log(pos))
    // ...
}
```

And you're good to go! See the full example at [examples/side-effects](examples/side-effects/index.tsx).

### The pitfall with componentScope()

When you apply `componentScope()` to an observable as above,

When you create stateful Properties or Atoms (i.e. ones that are based on Properties but add some local state, such as filter),
you need to specify a Scope that defines the lifetime of this Property/Atom.

Harmaja `componentScope` is very suitable, as it will activate the Property on component mount and deactivate on unmount.
The gotcha here is that when running the component constructor, the stateful Property is not in scope yet
(component is not mounted, and we should not activate before mount, or we get a resource leak).

So, you can subscribe to stateful Properties in the constructor, but you cannot `get` their value yet.
If you do, the `get()` call will throw an error saying "not in scope yet".

## Examples

Part of my process has been validating my work with some examples I've previously used for the comparison of different React state management solutions. Here I quickly list some examples, but I beg you to read the full story below, which will visit each of these examples in a problem context instead of just throwing a bucket of code in your face.

-   Todo App with Unidirectional data flow: [examples/todoapp](examples/todoapp/index.tsx). I've added some annotations. In this example, application state is reduced from different events (add/remove/complete todo item).

-   Todo App with Atoms: [examples/todoapp-atoms](examples/todoapp-atoms/index.tsx). It's rather less verbose, because with Atoms, you can decompose and manipulate substate directly using `atom.set` instead using events and reducers.

-   Finally a bit more involved example featuring a "CRM": [examples/consultants](examples/consultants/index.tsx). It features some harder problems like dealing with asynchronous (and randomly failing!) server calls as well as edit/save/cancel.

Examples covered also in the chapters below, with some context.

## Unidirectional data flow

Unidirectional data flow, popularized by Redux, is a leading state management pattern in web frontends today. In short, it means that you have a (usually essentially) global data _store_ or stores that represent pretty much the entire application state. Changes to this state are not effected directly by UI components but instead by dispacthing _events_ or _actions_ which then are processed by _reducers_ and applied to the global state. The state is treated as an immutable object and every time the reducers applies a new change to state, it effectively creates an entire new state object.

In Typescript, you could represent these concepts in the context of a Todo App like this:

```typescript
type Item = {}
type Event = { type: "add"; item: Item } | { type: "remove"; item: Item }
type State = { items: Item[] }
type Reducer = (currentState: State, event: Event) => State
interface Store {
    dispatch(event: Event)
    subscribe(observer: (event: Event) => void)
}
```

In this scenario, UI components will `subscribe` to changes in the `Store` and `dispatch` events to effect state changes. The store will apply its `Reducer` to incoming events and the notify the observer components on updated state.

The benefits are (to many, nowadays) obvious. These come from the top of my mind.

-   Reasoning about state changes is straightforward, as only reducers change state. You can statically backtrack all possible causes of a change to a particular part of application state.
-   The immutable global state object makes persisting and restoring application state easier, and makes it possible to create and audit trail of all events and state history. It also makes it easier to pass the application state for browser-side hydration after a server-side render.
-   Generally, reasoning about application logic is easier if there is a pattern, instead of a patchwork of ad hoc solutions

Implementations such as Redux allow components to _react_ to a select part of global state (instead of all changes) to avoid expensive updates. With React hooks, you can conveniently just `useSelector(state => pick interesting parts)` and you're done.

It's not a silver bullet though. Especially when using a single global store with React / Redux

-   There is no solution for local or scoped state. Sometimes you need scoped state that applies, for instance, to the checkout process of your web store. Or to widely used components such as an address selector. Or for storing pending changes to, say, user preferences before applying them to the global state.
-   This leads to either using React local state or some "corner" of the global state for these transient pieces of state
-   Refactoring state from local to global is tedious and error-prone because you use an entirely different mechanism for each
-   You cannot encapsulate functionalities (store checkout) into self-sustaining components because they are dependent on reducers which lively somewhere else completely

Other interesting examples of Unidirectional data flow include [Elm](https://elm-lang.org/) and [Cycle.js](https://cycle.js.org/).

## Unidirectional data flow with Harmaja

In Harmaja, you can implement Unidirectional data flow too. Sticking with the Todo App example, you define your events as [_buses_](https://github.com/raimohanska/lonna/blob/master/src/abstractions.ts#L145):

```typescript
import * as L from "lonna"

type AppEvent = { action: "add"; name: string } | { action: "remove"; id: Id }
const appEvents = L.bus<AppEvent>()
```

The bus objects allow you to dispatch an event by calling their `push` method. From the events, the application state can be reduced using [`L.scan`](https://github.com/raimohanska/lonna/blob/master/src/scan.ts) like thus:

```typescript
const initialItems: TodoItem[] = []
function reducer(items: TodoItem[], event: AppEvent): TodoItem[] {
    switch (event.action) {
        case "add":
            return items.concat(todoItem(event.name))
        case "remove":
            return items.filter((i) => i.id !== event.id)
    }
}
const allItems = appEvents.pipe(L.scan(initialItems, reducer, L.globalScope))
```

The `L.globalScope` parameter is used to specify the lifetime of the `allItems` property, i.e. how long it will be kept up-to-date. When using `globalScope` the property updates will never stop.
When creating statetul Properties within Harmaja components, you can also use `componentScope()` from `import { componentScope } from "harmaja"`, to stop updates after the components has been unmounted.

You can, if you like, then encapsulate all this into something like

```typescript
interface TodoStore {
    dispatch: (action: AppEvent) => void
    items: L.Property<TodoItem[]>
}
```

...so you have an encapsulation of this piece of application state, and you can pass this store to your UI components.

You can also define the buses and the derived state properties in your components if you want to have scoped state.
There is no such thing as _react context_ in Harmaja, so everything is either passed explicitly or defined in a global scope, at least for now.

The `globalScope` parameter above indicates the lifetime for the constructure reactive Property, and a global lifetime in this
case means that the value will be kept up-to-date indefinitely. If you declare state in a component, you should use `componentScope()` instead to
prevent resource leak. You can `import { componentScope } from "harmaja"`.

## From store to view

In unidirectional data flow setups, there's always a way to reflect the store state in your UI. For instance,

-   In [react-redux](https://github.com/reduxjs/react-redux) you can use the `useSelector` hook for extracting the parts of global state your component needs
-   In Elm and Cycle.js the whole state is always rendered from the root and you trust the framework to be effient in VDOM diffing

Pretty soon after React started gaining popularity, my colleagues at Reaktor (and I later) started using a "Bacon megablob" architecture where events and the "store" are
defined exactly as in the previous chapter, using Buses and a state Property. Thanks to React's relatively good performance with VDOM and diffing,
it's in most cases a viable choice. Sometimes though, it may prove too heavy to render everything everytime. If you have a "furry" (wide and deeply nested) data model,
doing a full render on every keystroke just might not work. This has caused pain and various optimizations (often involving local state) have been written.

However, it may make more sense to adopt the `useSelector`-like approach and instead of rendering the whole VDOM on all changes,
listen to relevant changes in your components and render on change. I wrote about one React Hooks based approach on the
[Reaktor blog](https://www.reaktor.com/blog/make-react-reactive-by-using-hooks/) earlierly.

Now if we consider the case of Harmaja, the situation is different from any React based approaches. First of all, Harmaja doesn't have VDOM diffing or Hooks. But the
fact that you can pass reactive properties as props fits the bill very nicely, so in the case of a TodoItem view, you can

```tsx
import { React, mount } from "../.."

const ItemView = ({ item }: { item: L.Property<TodoItem> }) => {
    return (
        <span>
            <span className="name">{L.view(item, (i) => i.name)}</span>
        </span>
    )
}
```

The first big difference to Redux is that instead of asking for stuff from the global state in your component implementation, you actually require the relevant data
in the function signature (how revolutionary!). This rather obviously makes the component easier to reason about, use in different context, test and so on. So just from
the function signature you can easily decuce that this component will render a TodoItem and reflect any changes that are effected to that particular TodoItem (because
the input is a reactive property).

In the implementation, the [`L.view`](https://github.com/raimohanska/lonna/blob/master/src/view.ts#L14) is used to get a `Property<string>` which
then can be directly embedded into the resulting DOM,
because Harmaja natively renders Properties. When the value of `name` changes, the updated value will be applied to DOM.

Think: _you can pick a part of your Store and use it as a Store_. This removes the need for the component to _know where the data is_ in the global store.
In react-redux all components that actually _react_ to store changes, need to know the "location" of their data in the store to be able to get it using `useSelector`.
In contrast using the Property abstraction you can easily `map` out the data from the store and give a handle to your components.

Another big difference is that store data and local data are the same. No separate mechanism for dealing with local state. Instead, you can declare more Properties in
your component constructors as you go, to flexibly define data stores at different application layers. Which arguably makes it easier to make changes too, as you don't
need to change the mechanism when moving from local to global. More on this topic below.

Anyway, let's put the Todo App together right now! To simplify a bit, if were were just rendering the first TodoItem (There's a chapter on array rendering down there), the root element of the application could look like this:

```tsx
const App = () => {
    const firstItem: Property<TodoItem> = L.view(allItems, (items) => items[0])
    return <ItemView item={firstItem} />
}
```

Then you can mount it and it'll start reacting to changes in the store:

```tsx
mount(<App />, document.getElementById("root")!)
```

Although I prefer components that get all of their required inputs in their constructor (this is called dependency injection), there's nothing to prevent you from
accessing global "stores" from your components as well.

See the full Todo App example [here](examples/todoapp/index.tsx).

## Composable read and write

So it's easy to _decompose_ data for viewing so that you can _compose_ your application out of components.
But what about writes? Do they compose too? It would certainly be nice not to have to worry about every single
detail in the high level "main reducer". Instead I find it an attractive idea to deal on a higher abstraction level.

Let's try! It's intuitive to start with this:

```typescript
updateTodoItem: L.Bus<TodoItem>()
todoItems: L.Property<TodoItem[]> // impl redacted
```

So instead of having to care about all the possible modifications to items on this level, there's a single `updateTodoItem` event that can be used to perform any update.

As shown earlierly, decomposition works nicely as you can call `L.view(item, i => i.someField)` to get views into its components parts.
Now let's revisit ItemView from the previous section and add a `onUpdate` callback.

```tsx
import { React, mount } from "../.."

const ItemView = ({
    item,
    onChange,
}: {
    item: L.Property<TodoItem>
    onChange: (i: TodoItem) => void
}) => {
    const onNameChange = (newName: string) => {
        /* wat */
    }
    return (
        <span>
            <TextInput
                text={L.view(item, (i) => i.name)}
                onChange={onNameChange}
            />
        </span>
    )
}

const TextInput = ({
    value,
    onChange,
}: {
    text: L.Property<string>
    onChange: (s: string) => void
}) => {
    return (
        <input value={text} onInput={(e) => onChange(e.currentTarget.value)} />
    )
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

Yet, in this case we _know_ that the property has a value and is active (the TextInput is subscribing to it to reflect
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
An `Atom<A>` simply represents a two-way interface to data by extending [`Property<A>`](https://github.com/raimohanska/lonna/blob/master/src/abstractions.ts#L126) and adding
a `set: (newValue: A)` method for changing the value. Let's try it by changing our TextInput to

```tsx
import { Atom, atom } from "lonna"
const TextInput = ({ value }: { text: Atom<string> }) => {
    return (
        <input value={text} onInput={(e) => text.set(e.currentTarget.value)} />
    )
}
```

This is the full implementation. Because Atom encapsulates both the view to the data (by being a Property)
and the callback for data update (through the `set` method), it can often be the sole prop an "editor" component needs.
To create an Atom in our unidirectional data flow context, we can construct an "dependent atom" from a `Property` and a `set` function
like so:

```tsx
const ItemView = ({
    item,
    onChange,
}: {
    item: L.Property<TodoItem>
    onChange: (i: TodoItem) => void
}) => {
    const itemAtom: Atom<TodoItem> = atom(item, onChange)
    return (
        <span>
            <TextInput value={L.view(itemAtom, "name")} />
        </span>
    )
}
```

And that's also the full implementation! I hope this demonstrates the power of the Atom abstraction. The [`view`](https://github.com/raimohanska/lonna/blob/master/src/view.ts) method there is particularly interesting (I redacted methods and the support for array keys for brevity):

```typescript
export interface Atom<A> extends L.Property<A> {
    set(newValue: A): this
    get(): A
}

function view<K extends keyof A>(a: Atom<A>, key: K): Atom<A[K]>
```

The same `view` method that you can use to get a read-only views into `Properties`, can be used to create another atom that gives read-write access to one field of ther TodoItem and done this in a type-safe manner (compiler errors in case you misspelled a field name).

Finally, we have an abstraction that makes read-write data decomposition a breeze! Adding more editable fields is no longer a chore. And all this still with unidirectional data flow, immutable data and type-safety.

The `view` method is actually based on the Lenses that's a concept been used in the functional programming world for quite a while. Yet, I haven't heard much talk about using Lenses in web application state management except for Calmm.js and before that the [Bacon.Model](https://github.com/baconjs/bacon.model) library. I could rant about lenses all night long but for now, I'll show you the Atom-specific signatures of the [`view`](https://github.com/raimohanska/lonna/blob/master/src/view.ts#L9) method:

```typescript
export function view<A, K extends keyof A>(
    a: Atom<A>,
    key: K
): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>
export function view<A, B>(a: Atom<A>, lens: L.Lens<A, B>): Atom<B>
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

```tsx
const ItemView = ({ item }: { item: Atom<TodoItem> }) => {
    return (
        <span>
            <TextInput value={L.view(item, "name")} />
        </span>
    )
}
```

and use it in your App like this:

```tsx
const App = () => {
    const item: Atom<TodoItem> = atom({
        id: 1,
        name: "do stuff",
        completed: false,
    })
    return <ItemView item={item} />
}
```

See, I created an independent Atom in the App component. It's practically local state to App now. Remember that in Harmaja, just like with Calmm.js,
component functions are to be treated like constructors. This means that the local variables created in the function
will live as long as the component is mounted, and can thus be used for local state (unlike in React where they would be re-ininitialized on every VDOM render).

That's all there is to local state in Harmaja, really. State can be defined globally, or in any level of the component tree. When you
use Atoms, you can define them locally or accept them as props. You can even add a fallback:

```typescript
const ItemView = ({ item }: { item: Atom<TodoItem> = atom(emptyTodoItem) }) => {
    ///
}
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
    name: string
    id: number
    completed: boolean
}
const addItemBus = new L.Bus<TodoItem>()
const removeItemBus = new L.Bus<TodoItem>()
const allItems: L.Property<TodoItem[]> = L.update(
    globalScope,
    [],
    [addItemBus, (items, item) => items.concat(item)],
    [removeItemBus, (items, item) => items.filter((i) => i.id !== item.id)]
)
```

### Rendering read-only arrays

To render the TodoItems represented by the `allItems` property you can use ListView thus:

```tsx
;<ListView
    observable={allItems}
    renderObservable={(item: L.Property<TodoItem>) => <ItemView item={item} />}
    getKey={(a: TodoItem) => a.id}
/>

const ItemView = ({ item }: { item: L.Property<TodoItem> }) => {
    // implement view for individual item
}
```

What ListView does here is that it observes `allItems` for changes and renders each item using the ItemView component.
When the list of items changes (something is replaced, added or removed) it uses the given `getKey` function to determine
whether to replace individual item views. With the given `getKey` implementation it replaces views only when the `id` field doesn't match,
i.e. the view no longer represents the same item. Each item view gets a `Property<TodoItem>` so that they can update when the content
in that particular TodoItem is changed. See full implementation in [examples/todoapp](examples/todoapp/index.ts).

### Rendering read-write arrays using Atoms

ListView also supports read-write access using `Atom`. So if you have

```typescript
const allItems: Atom<TodoItem[]> = atom([])
```

You can have read-write access to the items by using ListView thus:

```tsx
<ListView
    atom={items}
    renderAtom={(item, removeItem) => {
        return (
            <li>
                <ItemView {...{ item, removeItem }} />
            </li>
        )
    }}
    getKey={(a) => a.id}
/>
```

As you can see ListView provides a `removeItem` callback for Atom based views,
so that in your ItemView you can implement removal simply thus:

```tsx
const Item = ({
    item,
    removeItem,
}: {
    item: Atom<TodoItem>
    removeItem: () => void
}) => (
    <span>
        <span className="name">{L.view(item, "name")}</span>
        <a onClick={removeItem}>remove</a>
    </span>
)
```

This item view implementation only gives a readonly view with a remove link.
To make the name editable, you could now easily use the TextInput component we created earlierly:

```tsx
const Item = ({
    item,
    removeItem,
}: {
    item: Atom<TodoItem>
    removeItem: () => void
}) => (
    <span>
        <TextInput value={L.view(item, "name")} />
        <a onClick={removeItem}>remove</a>
    </span>
)
```

See the full atomic implementation of TodoApp in [examples/todoapp-atom](examples/todoapp-atoms/index.ts).

### Rendering read-only arrays as static views

There's a third variation of TextView still, for read-only views:

```tsx
<ListView
    observable={items}
    renderItem={(item: TodoItem) => (
        <li>
            <Item item={item} />
        </li>
    )}
/>
```

So if you provide `renderItem` instead of `renderObservable` or `renderAtom`, you can use a view that renders a plain TodoItem.
This means that the item view cannot react to changes in the item data and simply renders the static data it is given. So, when an item's content changes, the item view will be replaced by ListView.

You can optimize this variant a bit by supplying a `getKey` function to avoid full repaints when an item is added or removed.

## Component lifecycle

When components subscribe to data sources, it's vital to unsubscribe on unmount to prevent resource leaks.

In traditional React, you used the component lifecycle methods [`componentDidMount`](https://reactjs.org/docs/react-component.html#componentdidmount) and `componentWillUnmount` to subscribe and unsubscribe.
This kind of manual resource management is, based on my experience, very error-prone.
The [`useEffect`](https://reactjs.org/docs/hooks-effect.html) hook gives better tools for the job.
Still, you have to _remember_ to return a cleanup function (see [example](https://reactjs.org/docs/hooks-effect.html#example-using-hooks-1)).
When dealing with data sources such as Observables, Promises or the Redux Store, it's better to use a higher level of abstract to avoid doing cleanup manually.
And, because all of them are in fact generic abstractions, you can
build/steal/borrow generic utilities for this. The [`useSelector`](https://react-redux.js.org/api/hooks#useselector) hook in react-redux is a good example: it gives you the data you need
without bothering you with cleanup. Similarly you can build hooks for dealing with Observables as I discovered in my [blog post](https://www.reaktor.com/blog/make-react-reactive-by-using-hooks/) in 2018.

In Harmaja, there are no hooks. State management is built on Observables and subscriptions to observables are managed automatically based on component lifecycle. Details follow!

As told above, components in Harmaja are functions that are treated as constructors. The return value of a Harmaja component
is actually a native [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement).

When you embed observables into the DOM, Harmaja creates a placeholder node (empty text node) into the DOM tree and replaces it with
the real content when the observable yields a value. Whenever it subscribes to an observable, it attachs the resultant _unsub_ function to the created DOM node so that it can perform cleanup later.

When Harmaja replaces any DOM node, it recursively seeks all attached _unsubs_ in the node and its children and calls them to free
resources related to the removed nodes.

See [Dangling Subscriptions](https://github.com/raimohanska/harmaja/blob/master/README.md#dangling-subscriptions) for dealing with side-effects and scoping observables into component lifetime (which will ensure that resources are freed after component is unmounted).

## Promises and async requests

I don't think a state management solution is complete until it has a strategy for dealing with asynchronous requests, typically
with Promises. Common scenarios include

-   Fetching extra data from server when mounting a component. Gets more complicated if you need to re-fetch in case some componnent prop changes
-   Fetching data in response to a user action, i.e. the search scenario. This boils down the first scenario if you have a SearchResults component that fetches data in response to changed query string
-   Storing changed data to server. Complexity arises from the need to disable UI controls while saving, handling errors gracefully etc. Bonus points for considering whether this is a local or a global activity - and where should the transient state be stored.

In Harmaja, reactive Properties and EventStreams are used for dealing with asynchrous requests. Promises can be conveniently wrapped in. Let's have a look at an example.

### The search example

Let's consider the search example. Starting from SearchResults component, it might look like this:

```typescript
type SearchState =
    | { state: "initial" }
    | { state: "searching"; searchString: string }
    | { state: "done"; results: string[]; searchString: string }

const SearchResults = ({ state }: { state: L.Property<SearchState> }) => {
    // ?
}
```

I didn't want to make this too simple, because simple things are always easy to do. In this case, we want to

-   Show the results if any
-   Show "nothing found" in case the result is an empty array
-   Show an empty component in case there's nothing to show (state=initial)
-   Show "Searching..." when search is in progress, or show previous search results with `opacity:0.5` in case there are any

For starters we might try a simplistic approach:

```tsx
const SearchResultsSimplest = ({ state } : { state: L.Property<SearchState> }) => {
    const currentResults: L.Property<string[] | null = L.view(state, s => s.state === "done" ? s.results : null)
    const message: L.Property<string> = L.view(currentResults, r => r.length === 0 ? "Nothing found" : null)

    return <div>
        { message }
        <ul><ListView
            observable={currentResults}
            renderItem={ result => <li>{result}</li>}
        /></ul>
    </div>
}
```

The list of result and a message string are derived from the state using [`view`](https://github.com/raimohanska/lonna/blob/master/src/view.ts) (state decomposition in action).
Then we can easily include the "Searching" indicator using the same technique. But showing previous results while
searching requires some local state, because that's not incluced in `state`. Fortunately, reactive properties provide
good tools for this. For instance,

```typescript
const latestResults = state.pipe(
    L.changes, // Changes as EventStream
    L.scan(
        [],
        (
            results: string[],
            newState: SearchState // Start with [], use a Reducer
        ) => (newState.state === "done" ? newState.results : results) // Stick with previous unless "done"
    ),
    L.applyScope(componentScope()) // Keep up-to-date for component lifetime
)
```

Then we can determine the message string to show to the user, based on state and currently shown results:

```typescript
const message = L.view(state, latestResults, (s, r) => {
    if (s.state == "done" && r.length === 0) return "Nothing found"
    if (s.state === "searching" && r.length === 0) return "Searching..."
    return ""
})
```

Here's another way of using [`L.view`](https://github.com/raimohanska/lonna/blob/master/src/view.ts) for creating a new Property that reflects the latest values from the given two properties (state, latestResults)
applying the given mapping function to the values.

The `opacity:0.5` style can be applied similarly using [`L.view`](https://github.com/raimohanska/lonna/blob/master/src/view.ts) and the final SearchResults component looks like this:

```tsx
const SearchResults = ({ state }: { state: L.Property<SearchState> }) => {
    const latestResults = state.pipe(
        L.changes, // Changes as EventStream
        L.scan(
            [],
            (
                results: string[],
                newState: SearchState // Start with [], use a Reducer
            ) => (newState.state === "done" ? newState.results : results) // Stick with previous unless "done"
        ),
        L.applyScope(componentScope()) // Keep up-to-date for component lifetime
    )

    const message = L.view(state, latestResults, (s, r) => {
        if (s.state == "done" && r.length === 0) return "Nothing found"
        if (s.state === "searching" && r.length === 0) return "Searching..."
        return ""
    })

    const style = L.view(state, latestResults, (s, r) => {
        if (s.state === "searching" && r.length > 0) return { opacity: 0.5 }
        return {}
    })

    return (
        <div>
            {message}
            <ul style={style}>
                <ListView
                    observable={latestResults}
                    renderItem={(result) => <li>{result}</li>}
                />
            </ul>
        </div>
    )
}
```

But this was supposed to be about dealing with asynchronous requests! Let's get to the main Search component now.

```tsx
declare function search(searchString: string): Promise<string[]> // implement using fetch()

function searchAsProperty(s: string): L.Property<string[]> {
    return L.fromPromise(
        search(s),
        () => [],
        (xs) => xs,
        (error) => []
    )
}

const Search = () => {
    const searchString = L.atom("")
    const searchStringChange: L.EventStream<string> = searchString.pipe(
        L.changes,
        L.debounce(500, componentScope())
    )
    const searchResult = searchStringChange.pipe(
        L.flatMapLatest<string, string[]>(searchAsProperty)
    )
    const state: L.Property<SearchState> = L.update(
        componentScope(),
        { state: "initial" } as SearchState,
        [
            searchStringChange,
            (state, searchString) => ({ state: "searching", searchString }),
        ],
        [
            searchResult,
            searchString,
            (state, results, searchString) => ({
                state: "done",
                results,
                searchString,
            }),
        ]
    )

    return (
        <div>
            <h1>Cobol search</h1>
            <TextInput
                value={searchString}
                placeholder="Enter text to start searching"
            />
            <SearchResults state={state} />
        </div>
    )
}
```

Lots of interesting details above! First of all, I started with an Atom to store the current `searchString`. Then I plugged
the earlierly defined `TextInput` in place.

The actual `search` function is redacted and could be easily implemented using Axios or fetch. I added a simple wrapper `searchAsProperty`
that returns search results a `Property` instead of a `Promise`. This is easy using [`L.fromPromise`](https://github.com/raimohanska/lonna/blob/master/src/frompromise.ts#L16).

The `searchResult` EventStream is created using [`flatMapLatest`](https://github.com/raimohanska/lonna/blob/master/src/flatmaplatest.ts)
which spawns a new EventStream or Property for each input event using the `searchAsProperty`
helper and keeps on listening for results from the latest created stream (that's where the "latest" part in the name comes from).

Then I've introduced a reducer, once again using [`L.update`](https://github.com/raimohanska/lonna/blob/master/src/update.ts), and come up with the state property.
This setup is now local to the Search component,
but could be moved into a separate store module if it turned out that it's needed in a larger scope.

One more notice: on the last line of the reducer, I've included an extra parameter, i.e. the searchString property. This is a convenient way
to plug the latest value of a Property into the equation in a reducer. In each of the patterns in `L.update` you should have one EventStream and
zero or more Properties. Only the EventStream will trigger the update; Properties are there only so that you can use their latest value in the equation.

One common pattern in searching is throttling (or debouncing). You don't want to send a potentionally expensive query to your server on each keystroke.
When using Lonna, you can choose between [`debounce`](https://github.com/raimohanska/lonna/blob/master/src/debounce.ts) and [`throttle`](https://github.com/raimohanska/lonna/blob/master/src/throttle.ts).

To use a 300 millisecond debounce, the change looks like this:

```typescript
const searchStringChange: L.EventStream<string> = searchString
    .changes()
    .debounce(300)
```

See the full search implementation at [examples/search](examples/search/index.tsx).

More dealing with async request at [examples/consultants](examples/consultants/index.tsx).

## Detaching and syncing state

I find quite often myself wanting to have some local state for editing something that comes from the global state. I mean so that the local changes are not automatically pushed to the global state.

I wrote the following helper for this:

```typescript
export function editAtom<A>(source: L.Property<A>): L.Atom<A> {
    const localValue = L.atom<A | undefined>(undefined)
    const value = L.view(source, localValue, (s, l) =>
        l !== undefined ? l : s
    )
    return L.atom(value, localValue.set)
}
```

This method gives you an `Atom` that reflects the global state _until a local change is made_ and after that, reflects the local state. You can do

```typescript
const globalState: Atom<string>
const localState = editAtom(globalState)
```

Now in your component you can work with the `localState` atom freely. When you want to commit the value back to global state, you can

```typescript
globalState.set(localState.get())
```

The topic is also covered in [examples/todoapp-backend](examples/todoapp-backend/index.tsx).
´

## Motivation and background

For a long time I've been pondering different state management solutions for React. My thinkin in this field is strongly affected byt the fact that I'm pretty deep into Observables and FRP (functional reactive programming) and have authored the Bacon.js library back in the day. I've seen many approaches to frontend state management and haven't been entirely satisfied with any of them. This has lead into spending lots of time considering how I could apply FRP to state management in an "optimal" way.

So one day I had some spare time and couldn't go anywhere so I started drafting on what would be my ideal "state management solution". I wrote down the design goals, which are in no particular priority order at the moment.

-   G1 Intuitive: construction, updates, teardown
-   G2 Safe: no accidental updates to nonexisting components etc.
-   G3 Type-safe (Typescript)
-   G4 Immutable data all the way
-   G5 Minimum magic (no behind-the-scenes watching of js object property changes etc)
-   G6 Small API surface area
-   G7 Small runtime footprint
-   G8 Easy mapping of (changing) array of data items to UI elements
-   G9 Easy to interact with code outside the "framework": don't get in the way, this is just programming
-   GA Minimal boilerplate
-   GB Composability, state decomposition (Redux is composing, Calmm.js with lenses is decomposing)
-   GC Easy and intuitive way of creating local state (and pushing it up the tree when need arises)
-   GD Performant updates with minimal hassle. No rendering the full page when something changes

Calmm.js, by [Vesa] (https://github.com/polytypic), is pretty close! It uses Atoms and Observables for state management and treats React function components essentially as constructors. This approach makes it straightforward to introduce, for example, local state variables as regular javascript variables in the "constructor" function. It treats local and global state similarly and makes it easy to refactor when something needs to change from local to higher-up in the tree.

Yet, it's not type-safe and is hard to make thus. Especially the highly flexible [partial.lenses](https://github.com/calmm-js/partial.lenses) proves hard. Also, when looking at it more closely, it goes against the grain of how React is usually used, which will make it a bit awkward for React users. Suddenly you have yet another kind of component at your disposal, which expects you not to call it again on each render. In fact, I felt that Calmm.js doesn't really need anything from React which is more in the way instead of being helpful.

A while ago Vesa once-gain threw a mindblowing demonstration of how he had adapted the Calmm approach to WPF using C#. This opened my eyes to the fact that you don't need a VDOM diffing framework to do this. It's essentially just about calling component constructors and passing reactive variables down the tree.

After some hours of coding I had ~200 lines of Typescript which already rendered function components and allowed embedding reactive values into the VDOM, replacing actual DOM nodes when the reactive value changed. After some more hours of coding I have a prototype-level library that you can also try out. Let me hear your thoughts!

## Status

This is an experimental library. I have no idea whether it will evolve into something that you would use in production. Feel free to try and contribute though! I'll post the crucial shortcomings as Issues.

Next challenge:

-   JSX typings, including allowing Properties as attribute values. Currently using React's typings which are not correct and cause compiler errors which require using `any` here and there

More work

-   Support list of elements as render result
-   Remove the `span` wrapper from smartarray
-   Render directly as DOM elements instead of creating VDOM (when typings are there)
