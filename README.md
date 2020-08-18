# Harmaja

An experimental web frontend framework named after a lighthouse. It maybe easiest to describe it in contrast to React. 

- Uses JSX syntax just like React
- Function components only
- Component function is treated like a *constructor*, i.e. called just once per component lifecycle
- Dynamic content passed to components as observable properties
- Uses Bacon.js for observables at the moment
- Strongly inspired by [Calmm.js](https://github.com/calmm-js/documentation/blob/master/introduction-to-calmm.md). If you're familiar with Calmm, you can think of Harmaja as "Calmm, but with types and no React dependency

The documentation here is lacking, and it will help if you're already familiar with Redux, Calmm.js and Bacon.js (or other reactive library such as RxJs).

## Key concepts

*Reactive Property* (also known as a signal or a behaviour) is an object that encapsulates a changing value. Please check out the [Bacon.js intro](https://baconjs.github.io/api3/index.html) if you're not familiar with the concept. In Harmaja, reactive properties are the main way of storing and passing application state.

*Atom* is a Property that also allows mutation using the `set` methods. You can create an atom simply by `atom("hello")` and then use `atom.get` and `atom.set` for viewing and mutating its value. May sound underwhelming, but the Atom is also a reactive property, meaning that it's state can be observed and *reacted*. In Harmaja particularly, you can embed atoms into your VDOM so that your DOM will automatically reflect the changes in their value!

*State decomposition* means selecting a part or a slice of a bigger state object. This may be familiar to you from Redux, where you `mapStateToProps` or `useSelector` for making your component *react* to changes in some parts of the application state. In Harmaja, you use reactive properties or Atoms for representing state and then select parts of it for your component using `property.map` or `atom.view`, the latter providing a read-write interface.

*State composition* is the opposite of the above (but will co-operate nicely) and means that you can compose state from different sources. This is also a familiar concept from Redux, if you have ever composed reducers. 

You can very well combine the above concepts so that you start with several state atoms and event streams, then compose them all into a single "megablob" and finally decompose from there to deliver the essential parts of each of your components.

## Examples

Part of my process has been validatig my work with some examples I've previously used for the comparison of different React state management solutions. 

First, let's consider a TODO app. See the [examples/todoapp/index.tsx](examples/todoapp/index.tsx). I've added some annotations. In this example, application state is reduced from different events (add/remove/complete todo item).

Then there's the same application using Atoms [examples/todoapp-atoms/index.tsx](examples/todoapp-atoms/index.tsx). It's rather less verbose, because with Atoms, you can decompose and manipulate substate directly using `atom.set` instead using events and reducers.

Finally a bit more involved example featuring a "CRM": [examples/consultants/index.tsx](examples/consultants/index.tsx). It features some harder problems like dealing with asynchronous (and randomly failing!) server calls as well as edit/save/cancel.

## Motivation and background

For the longest time I've been pondering different state management solutions for React. As some may know, I'm pretty deep into Observables and FRP (functional reactive programming) and have authored the Bacon.js library back in the day. So one day I had some spare time and couldn't go anywhere so I started drafting on what would be my ideal "state management solution". I wrote down the design goals, which are in no particular priority order at the moment.

G1 Intuitive: construction, updates, teardown
G2 Safe: no accidental updates to nonexisting components
G3 Type-safe (Typescript)
G4 Immutable data all the way
G5 Minimum magic (no behind-the-scenes watching of js object property changes etc)
G6 Small API surface area
G7 Small runtime footprint    
G8 Easy mapping of (changing) array of data items to UI elements
G9 Easy to interact with code outside the "framework": don't get in the way, this is just programming
GA Minimal boilerplate
GB Composability, state decomposition (Redux is composing, Calmm.js with lenses is decomposing)
GC Easy and intuitive way of creating local state (and pushing it up the tree when need arises)
GD Performant updates with minimal hassle. No rendering the full page when something changes

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