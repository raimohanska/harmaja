import * as Rx from "rxjs"
import { scan, publishReplay, shareReplay, refCount, map, startWith, tap } from "rxjs/operators"
import { h, mount, ListView, atom, Atom, unmountEvent, onUnmount } from "../../rxjs"
import itemAddedFromSocketE from "./fake-socket";

// TODO: I cannot seem to get this right with RxJs. 
// You can observe incorrect behavior when you remove the first item and click on the completion checkbox of the remaining one.

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

const appEvents = new Rx.Subject<AppEvent>()

// New items event stream is merged from use events and events from "server"

itemAddedFromSocketE.forEach(name => appEvents.next({ action: "add", name }))

// The state "megablob" reactive property created by reducing from events

function reducer(items: TodoItem[], event: AppEvent): TodoItem[] {
  switch (event.action) {
    case "add": return items.concat(todoItem(event.name))
    case "remove": return items.filter(i => i.id !== event.id)
    case "update":return items.map(i => i.id === event.item.id ? event.item : i)
    default: console.warn("Unknown event", event)
  }
}

const allItems: Rx.Observable<TodoItem[]> = appEvents.pipe(
  scan(reducer, initialItems),
  startWith(initialItems),
  tap(e => console.log("Updating", e)),
  shareReplay(),
  tap(e => console.log("Emitting", e)) // TODO: when removing the first item, why are out-of-date values emitted to some observers?
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
const ItemList = ({ items }: { items: Rx.Observable<TodoItem[]>}) => {
  return (
    <ul>
      {/* when using this variant of ListView (renderItem) the items
          will be completely replaced with changed (based on the given `equals`) */}
      <ListView 
        observable={items} 
        renderObservable={(id: number, item: Rx.Observable<TodoItem>) => <li><ItemView id={id} item={item}/></li>}
        getKey={ item => item.id }
      />
    </ul>
  );
};

const ItemView = ({ id, item }: { id: number, item: Rx.Observable<TodoItem> }) => {  
  // Use a "dependent atom", where you can specify what happens when the value is changed. In
  // this case we push changes to the bus which will then cause state changes to propagate back here.
  // A dependent atom provides a bridge between atom-based components and "unidirectional data flow"
  // style state management.
  const itemAtom = atom(item, updated => appEvents.next({ action: "update", item: updated }))
  
  return (
    <span>
      <span className="name"><TextInput value={itemAtom.view("name")} /></span>
      <Checkbox checked={itemAtom.view("completed")}/>
      <a className="removeItem" onClick={() => appEvents.next({ action: "remove", id})}>
        remove
      </a>
    </span>
  );
};

const NewItem = () => {
  const name = atom("")
  const addNew = () => appEvents.next({ action: "add", name: name.get() })
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

const JsonView = ({ json }: { json: Rx.Observable<any>}) => {
  return <pre>{json.pipe(map(st => JSON.stringify(st, null, 2)))}</pre>;
};

mount(<App/>, document.getElementById("root")!)