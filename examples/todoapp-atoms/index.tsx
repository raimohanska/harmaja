import * as B from "lonna"
import { h, mount, ListView } from "../../src/index"
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
const allItems: B.Atom<TodoItem[]> = B.atom(initialItems)
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

const ItemList = ({ items }: { items: B.Atom<TodoItem[]>}) => {
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

const ItemView = ({ item, removeItem }: { item: B.Atom<TodoItem>, removeItem: () => void }) => {  
  const completed: B.Atom<boolean> = B.view(item, "completed")
  
  return (
    <span>
      <span className="name">{B.view(item, "name")}</span>
      <Checkbox checked={completed}/>
      <a className="removeItem" onClick={removeItem}>
        remove
      </a>
    </span>
  );
};

const NewItem = () => {
  const name = B.atom("")
  const addNew = () => addItem(name.get())
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
            value: props.value,
            checked: props.checked 
          }} />  
  };

const JsonView = ({ json }: { json: B.Property<any>}) => {
  return <pre>{json.pipe(B.map(st => JSON.stringify(st, null, 2)))}</pre>;
};
  

mount(<App/>, document.getElementById("root")!)