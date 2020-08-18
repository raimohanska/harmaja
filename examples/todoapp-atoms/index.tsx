import * as B from "baconjs"
import { React, mount, ListView, Atom, atom } from "../../dist"
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

// Application state defined as a single Atom
const allItems: Atom<TodoItem[]> = atom(initialItems)
// Helper function for adding a new item
const addItem = (name: string) => allItems.modify(items => items.concat(todoItem(name)))
itemAddedFromSocketE.forEach(addItem)

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
        renderAtom={(item, removeItem) => {
          // This variant of ListView (with renderAtom) gives a read-write
          // view for each item view. It also gives you a handle for removing the item
          return <li><Item {...{item, removeItem}}/></li>          
        }}
        equals={(a, b) => a.id === b.id}
      />
    </ul>
  );
};

const Item = ({ item, removeItem }: { item: Atom<TodoItem>, removeItem: () => void }) => {  
  const completed = item.view("completed")
  
  return (
    <span>
      <span className="name">{item.view("name")}</span>
      <Checkbox checked={completed}/>
      <a className="removeItem" onClick={() => { removeItem()}}>
        remove
      </a>
    </span>
  );
};

const NewItem = () => {
  const name = atom("")
  const addNew = () => addItem(name.get())
  return (
    <div className="newItem">
      <Input placeholder="new item name" value={name} />
      <button onClick={addNew}>Add new item</button>
    </div>
  );
};

const Input = (props: { value: Atom<string> } & any) => {
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