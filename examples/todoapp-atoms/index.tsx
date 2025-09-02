import { h, mount, ListView, atomFromValue, Atom, Signal } from "../../src/index"
import { subscribeToNewItems } from "./fake-socket";

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

// Application state defined as a single Atom
const allItems: Atom<TodoItem[]> = atomFromValue(initialItems)
// Helper function for adding a new item
const addItem = (name: string) => allItems.modify(items => items.concat(todoItem(name)))
subscribeToNewItems(addItem)

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

const ItemList = ({ items }: { items: Atom<TodoItem[]>}) => {
  return (
    <ul>
      <ListView
        atom={items} 
        renderAtom={(id, item, removeItem) => {
          // This variant of ListView (with renderAtom) gives a read-write
          // view for each item view. It also gives you a handle for removing the item
          return <li><ItemView {...{item, removeItem}}/></li>          
        }}
        getKey={item => item.id}
      />
    </ul>
  );
};

const ItemView = ({ item, removeItem }: { item: Atom<TodoItem>, removeItem: () => void }) => {  
  const completed: Atom<boolean> = item.view("completed")
  
  return (
    <span>
      <span className="name">{item.view("name")}</span>
      <Checkbox checked={completed}/>
      <a className="removeItem" onClick={removeItem}>
        remove
      </a>
    </span>
  );
};

const NewItem = () => {
  const name = atomFromValue("")
  const addNew = () => addItem(name.get())
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
            value: props.value,
            checked: props.checked 
          }} />  
  };

const JsonView = ({ json }: { json: Signal<any>}) => {
  const s = json.map(st => JSON.stringify(st, null, 2))
  return <pre>{s}</pre>;
}

mount(<App/>, document.getElementById("root")!)