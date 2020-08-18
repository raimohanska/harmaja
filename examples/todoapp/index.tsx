import * as B from "baconjs"

import { React, mount, ListView, Atom, atom } from "../.."
import itemAddedFromSocketE from "./fake-socket";

// The domain object constructor
let idCounter = 1;
type TodoItem = {
    name: string,
    id: number,
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

// Events/actions
const addItemBus = new B.Bus<string>();
const removeItemBus = new B.Bus<TodoItem>();
const setCompletedBus = new B.Bus<[TodoItem, boolean]>();
// New items event stream is merged from use events and events from "server"
// Merging two streams of strings and finally mapping them into TodoItem objects
const newItemE = itemAddedFromSocketE.merge(addItemBus).map(todoItem)

// The state "megablob" reactive property created by reducing from events
const allItems: B.Property<TodoItem[]> = B.update(initialItems, 
    [newItemE, (items, item) => items.concat(item)],
    [removeItemBus, (items, item) => items.filter(i => i.id !== item.id)],
    [setCompletedBus, (items, [item, completed]) => items.map(i => i.id === item.id ? { ...item, completed} : i)]
)

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

const ItemList = ({ items }: { items: B.Property<TodoItem[]>}) => {
  return (
    <ul>
      {/* when using this variant of ListView (renderItem) the items
          will be completely replaced with changed (based on the given `equals`) */}
      <ListView 
        observable={items} 
        renderItem={(item: TodoItem) => <li><Item item={item}/></li>}
        equals={(a, b) => a === b}
      />
    </ul>
  );
};

const Item = ({ item }: { item: TodoItem }) => {  
  const completed = atom(item.completed)
  completed.changes().forEach(c => setCompletedBus.push([item, c]))
  return (
    <span>
      <span className="name">{item.name}</span>
      <Checkbox checked={completed}/>
      <a className="removeItem" onClick={() => removeItemBus.push(item)}>
        remove
      </a>
    </span>
  );
};

const NewItem = () => {
  const name = atom("")
  const addNew = () => addItemBus.push(name.get())
  return (
    <div className="newItem">
      <Input placeholder="new item name" value={name} />
      <button onClick={addNew}>Add new item</button>
    </div>
  );
};

const Input = (props: { value: B.Atom<string> } & any) => {
  return <input {...{ 
          type: "text", 
          onChange: e => { 
              props.value.set(e.target.value)
          },
          ...props, 
          checked: props.checked 
        }} />  
};

const Checkbox = (props: { checked: Atom<boolean> } & any) => {
    return <input {...{ 
            type: "checkbox", 
            onInput: e => { 
                props.checked.set(e.target.checked)
            },
            ...props, 
            value: props.value 
          }} />  
  };

const JsonView = ({ json }: { json: B.Property<any>}) => {
  return <pre>{json.map(st => JSON.stringify(st, null, 2))}</pre>;
};

mount(<App/>, document.getElementById("root")!)