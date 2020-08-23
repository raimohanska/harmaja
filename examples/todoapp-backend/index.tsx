import * as B from "baconjs"

import { h, mount, ListView, Atom, atom } from "../../src/index"
import { todoItem, TodoItem, Id } from "./domain";
import { saveChangesToServer, ServerFeedEvent, listenToServerEvents, findIndex } from "./server";

type EditState = { state: "view" } | { state: "edit", item: TodoItem } | { state: "saving", item: TodoItem } | { state: "adding", item: TodoItem }
type Notification = { type: "info" | "warning" | "error"; text: string };

const updates = new B.Bus<ServerFeedEvent>()
const saveRequest = new B.Bus<TodoItem>()
const cancelRequest = new B.Bus<void>()
const editRequest = new B.Bus<TodoItem>()
const addRequest = new B.Bus<TodoItem>()

const saveResult = saveRequest.merge(addRequest).flatMap(item =>
  B.fromPromise(saveChangesToServer(item))
    .map(() => item as TodoItem | null)
    .mapError(() => null)
)

const allItems: B.Property<TodoItem []> = updates.scan([], reducer)
const editState = B.update<EditState>({ state: "view" }, 
  [addRequest, (_, item) => ({ state: "adding", item})],
  [editRequest, (_, item) => ({ state: "edit", item})],
  [saveRequest, (_, item) => ({ state: "saving", item})],
  [saveResult, (state, success) => (!success && state.state == "saving") ? { state: "edit", item: state.item } : { state: "view"}],
  [cancelRequest, () => ( { state: "view" })]
)
const saveFailed = saveResult.filter(success => !success)
const saveSuccess = saveResult.filter(success => !!success)
const notificationE: B.EventStream<Notification> = 
  saveFailed.map(() => ({ type: "error", text: "Failed to save"} as Notification))
  .merge(saveSuccess.map(() => ({ type: "info", text: "Saved"})))
const notification: B.Property<Notification | null> = notificationE
  .flatMapLatest(notification => B.once(notification).concat(B.later(2000, null)))
  .toProperty(null)

saveResult.forEach(savedTodoItem => {
  if (savedTodoItem) {
    updates.push({ type: "upsert", items: [ savedTodoItem ]})
  }
})
listenToServerEvents(event => updates.push(event))
// Helper function for applying a batch of updates to a list of items
function applyUpdates(initialItems: TodoItem[], updatedItems: TodoItem[]): TodoItem[] {
  return updatedItems.reduce((current: TodoItem[], updatedConsultant: TodoItem) => {
    const foundIndex = findIndex(current, c => c.id === updatedConsultant.id);
    if (foundIndex >= 0) {
      const updatedItems = [...current];
      updatedItems[foundIndex] = updatedConsultant;
      return updatedItems;
    } else {
      return [...current, updatedConsultant];
    }
  }, initialItems);
}

// Helper function to compute the next state of a item list given a new event from the server
function reducer(items: TodoItem[], event: ServerFeedEvent) {
  switch (event.type) {
    case "init":
      return event.items;
    case "upsert":
      return applyUpdates(items, event.items);
    default:
      console.warn("Unknown event from server", event);
      return items;
  }
}

const App = () => {
  return (
    <div>
      <NotificationView {...{ notification }} />
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
        renderObservable={(id: number, item: B.Property<TodoItem>) => <li><ItemView id={id} item={item} editState={editState}/></li>}
        key={ item => item.id }
      />
    </ul>
  );
};

type ItemState = "view" | "edit" | "disabled";
const ItemView = ({ id, item, editState }: { id: number, editState: B.Property<EditState>, item: B.Property<TodoItem> }) => {  
  const itemState: B.Property<ItemState> = B.combineWith(item, editState, (c, state) => {
    if (state.state === "edit") {
      if (state.item.id === c.id) {
        return "edit"
      }
      return "disabled"
    }
    if (state.state === "saving" || state.state === "adding") {
      return "disabled"
    }
    return "view"
  })
  const itemToShow: B.Property<TodoItem> = B.combineWith(item, editState, (c, state) => {
    if (state.state !== "view" && state.item.id === c.id) {
      return state.item
    }
    return c
  })
  const localItem: Atom<TodoItem> = atom(itemToShow, editRequest.push)

  async function saveLocalChanges() {
    const currentItem = localItem.get()
    saveRequest.push(currentItem)
  }

  function cancelLocalChanges() {
    cancelRequest.push()
  }
  
  return (
    <span className={itemState}>
      <span className="name"><TextInput value={localItem.view("name")} /></span>
      <Checkbox checked={localItem.view("completed")}/>
      {
        itemState.map(s => s === "edit" ? <span className="controls">
            <a href="#" onClick={saveLocalChanges}>Save</a>
            <a href="#" onClick={cancelLocalChanges}>Cancel</a>
          </span>
        : null)
      }
    </span>
  );
};

const NewItem = () => {
  const disableNew: B.Property<boolean> = editState.map(state => state.state !== "view");
  const name = atom("")
  const addNew = () => addRequest.push(todoItem(name.get()))
  return (
    <div className="newItem">
      <TextInput placeholder="new item name" value={name} />
      <button disabled={disableNew} onClick={addNew}>Add new item</button>
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

function NotificationView({ notification }: { notification: B.Property<Notification | null> }) {
  return notification.map(notification => {
    if (!notification) return null;
    return (
      <div
        style={{
          backgroundColor: notification.type === "error" ? "red" : notification.type === "warning" ? "orange" : "green",
          color: "white",
          padding: "1em"
        }}
      >
        {notification.text}
      </div>
    );  
  })
}  

const JsonView = ({ json }: { json: B.Property<any>}) => {
  return <pre>{json.map(st => JSON.stringify(st, null, 2))}</pre>;
};

mount(<App/>, document.getElementById("root")!)