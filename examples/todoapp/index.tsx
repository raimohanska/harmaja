import * as B from "baconjs"

import { h, mount, ListView, Atom, atom } from "../../src/index"
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

// Events/actions
const addItemBus = new B.Bus<string>();
const removeItemBus = new B.Bus<Id>();
const updateItemBus = new B.Bus<TodoItem>();
// New items event stream is merged from use events and events from "server"
// Merging two streams of strings and finally mapping them into TodoItem objects
const newItemE = itemAddedFromSocketE.merge(addItemBus).map(todoItem)

// The state "megablob" reactive property created by reducing from events
const allItems: B.Property<TodoItem[]> = B.update(initialItems, 
    [newItemE, (items, item) => items.concat(item)],
    [removeItemBus, (items, removedItemId) => items.filter(i => i.id !== removedItemId)],
    [updateItemBus, (items, updatedItem) => items.map(i => i.id === updatedItem.id ? updatedItem : i)]
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
        key={ item => item.id }
      />
    </ul>
  );
};

const ItemView = ({ id, item }: { id: number, item: B.Property<TodoItem> }) => {  
  // Use a "dependent atom", where you can specify what happens when the value is changed. In
  // this case we push changes to the bus which will then cause state changes to propagate back here.
  // A dependent atom provides a bridge between atom-based components and "unidirectional data flow"
  // style state management.
  const itemAtom = atom(item, updated => updateItemBus.push(updated))
  
  return (
    <span>
      <span className="name"><TextInput value={itemAtom.view("name")} /></span>
      <Checkbox checked={itemAtom.view("completed")}/>
      <a className="removeItem" onClick={() => removeItemBus.push(id)}>
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
      <TextInput placeholder="new item name" value={name} />
      <button onClick={addNew}>Add new item</button>
    </div>
  );
};

const TextInput = (props: { value: Atom<string> } & any) => {
  return <input {...{ 
          type: "text", 
          onInput: e => { 
              props.value.set(e.currentTarget.value)
          },
          ...props, 
          value: props.value 
        }} />  
};

const Checkbox = (props: { checked: Atom<boolean> } & any) => {
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
  return <pre>{json.map(st => JSON.stringify(st, null, 2))}</pre>;
};

mount(<App/>, document.getElementById("root")!)