import * as B from "lonna"
import { globalScope } from "lonna";

import { h, mount, ListView } from "../../src/index"
import itemAddedFromSocketE from "./fake-socket";

// The domain object constructor
let idCounter = 1;
type Id = number
type TodoItem = {
    name: string,
    id: Id,
    completed: boolean
}
function todoItem(name: string, id: number = idCounter++, completed: boolean = false): TodoItem { 
    return {
    name,
    completed,
    id
    }
}
const initialItems = ["learn typescript", "fix handbrake"].map(s => todoItem(s));

type AppEvent = { action: "add", name: string } | { action: "remove", id: Id } | { action: "update", item: TodoItem }

const appEvents = B.bus<AppEvent>()
// Events/actions
// New items event stream is merged from use events and events from "server"
// Merging two streams of strings and finally mapping them into TodoItem objects
//const newItemE = Rx.map(Rx.merge(itemAddedFromSocketE, addItemBus), todoItem)

itemAddedFromSocketE.forEach(name => appEvents.push({ action: "add", name }))

// The state "megablob" reactive property created by reducing from events

function reducer(items: TodoItem[], event: AppEvent): TodoItem[] {
  switch (event.action) {
    case "add": return items.concat(todoItem(event.name))
    case "remove": return items.filter(i => i.id !== event.id)
    case "update":return items.map(i => i.id === event.item.id ? event.item : i)
    default: console.warn("Unknown event", event)
  }
}
const allItems = appEvents.pipe(B.scan(initialItems, reducer, globalScope))

const App = () => {
  return (
    <div>
      <h1>TODO App</h1>
      <ItemList items={allItems} />
      <NewItem />
      <JsonView json={allItems} />
    </div>
  );
};

/*
ItemList2 uses the "observable" version of ListView. Here the renderObservable function gets
Property<TodoItem> and is thus able to observe changes in the item. Now we don't have to replace
the whole item view when something changes.
*/
const ItemList = ({ items }: { items: B.Property<TodoItem[]>}) => {
  return (
    <ul>
      {/* when using this variant of ListView (renderItem) the items
          will be completely replaced with changed (based on the given `equals`) */}
      <ListView 
        observable={items} 
        renderObservable={(id: number, item: B.Property<TodoItem>) => <li><ItemView id={id} item={item}/></li>}
        getKey={ item => item.id }
      />
    </ul>
  );
};

const ItemView = ({ id, item }: { id: number, item: B.Property<TodoItem> }) => {  
  // Use a "dependent atom", where you can specify what happens when the value is changed. In
  // this case we push changes to the bus which will then cause state changes to propagate back here.
  // A dependent atom provides a bridge between atom-based components and "unidirectional data flow"
  // style state management.
  const itemAtom = B.atom(item, updated => appEvents.push({ action: "update", item: updated }))
  
  return (
    <span>
      <span className="name"><TextInput value={B.view(itemAtom, "name")} /></span>
      <Checkbox checked={B.view(itemAtom, "completed")}/>
      <a className="removeItem" onClick={() => appEvents.push({ action: "remove", id})}>
        remove
      </a>
    </span>
  );
};

const NewItem = () => {
  const name = B.atom("")
  const addNew = () => appEvents.push({ action: "add", name: name.get() })
  return (
    <div className="newItem">
      <TextInput placeholder="new item name" value={name} />
      <button onClick={addNew}>Add new item</button>
    </div>
  );
};

const TextInput = (props: { value: B.Atom<string> } & any) => {
  return <input {...{ 
          type: "text", 
          onInput: e => { 
              props.value.set(e.currentTarget.value)
          },
          ...props, 
          value: props.value 
        }} />  
};

const Checkbox = (props: { checked: B.Atom<boolean> } & any) => {
    return <input {...{ 
            type: "checkbox", 
            onInput: e => { 
                props.checked.set(e.currentTarget.checked)
            },
            ...props, 
            checked: props.checked 
          }} />  
  };

const JsonView = ({ json }: { json: B.Property<any>}) => {
  return <pre>{json.pipe<B.Property<string>>(B.map(st => JSON.stringify(st, null, 2)))}</pre>;
};

mount(<App/>, document.getElementById("root")!)