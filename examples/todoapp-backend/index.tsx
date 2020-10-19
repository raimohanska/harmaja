import * as L from "lonna"
import { globalScope } from "lonna";

import { h, mount, ListView } from "../../src/index"
import { todoItem, TodoItem, Id } from "./domain";
import { saveChangesToServer, ServerFeedEvent, listenToServerEvents, findIndex } from "./server";

type EditState = { state: "view" } | { state: "edit", item: TodoItem } | { state: "saving", item: TodoItem } | { state: "adding", item: TodoItem }
type Notification = { type: "info" | "warning" | "error"; text: string };

const updates = L.bus<ServerFeedEvent>()
const saveRequest = L.bus<TodoItem>()
const cancelRequest = L.bus<void>()
const editRequest = L.bus<TodoItem>()
const addRequest = L.bus<TodoItem>()
const op = L.flatMap((item: TodoItem) => {
    const fp = L.fromPromise<void, null | TodoItem>(saveChangesToServer(item), 
      () => undefined, // this never passes because only changes are monitored
      () => item, 
      error => null
    )
    return L.changes(fp)
  },
  globalScope
)
const saveResult = L.merge(saveRequest, addRequest).pipe(op)

const allItems: L.Property<TodoItem []> = updates.pipe(L.scan([], reducer, globalScope))
const editState = L.update<EditState>(globalScope, { state: "view" }, 
  [addRequest, (_, item) => ({ state: "adding", item})],
  [editRequest, (_, item) => ({ state: "edit", item})],
  [saveRequest, (_, item) => ({ state: "saving", item})],
  [saveResult, (state, success) => (!success && state.state == "saving") ? { state: "edit", item: state.item } : { state: "view"}],
  [cancelRequest, () => ( { state: "view" })]
)
const saveFailed = saveResult.pipe(L.filter(success => !success), L.map(() => ({ type: "error", text: "Failed to save"} as Notification)))
const saveSuccess = saveResult.pipe(L.filter(success => !!success), L.map(() => ({ type: "info", text: "Saved"} as Notification)))

const notificationE = L.merge(saveFailed, saveSuccess)
const notification: L.Property<Notification | null> = notificationE.pipe(
  L.flatMapLatest((notification: Notification) => L.later(2000, null).pipe(L.toProperty(notification))),
  L.toProperty(null, globalScope)
)

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
    </div>
  );
};

/*
ItemList2 uses the "observable" version of ListView. Here the renderObservable function gets
Property<TodoItem> and is thus able to observe changes in the item. Now we don't have to replace
the whole item view when something changes.
*/
const ItemList = ({ items }: { items: L.Property<TodoItem[]>}) => {
  return (
    <ul>
      {/* when using this variant of ListView (renderItem) the items
          will be completely replaced with changed (based on the given `equals`) */}
      <ListView 
        observable={items} 
        renderObservable={(id: number, item: L.Property<TodoItem>) => <li><ItemView id={id} item={item} editState={editState}/></li>}
        getKey={ item => item.id }
      />
    </ul>
  );
};

type ItemState = "view" | "edit" | "disabled";
const ItemView = ({ id, item, editState }: { id: number, editState: L.Property<EditState>, item: L.Property<TodoItem> }) => {  
  const itemState: L.Property<ItemState> = L.combine(item, editState, (c, state) => {
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
  const itemToShow: L.Property<TodoItem> = L.combine(item, editState, (c, state) => {
    if (state.state !== "view" && state.item.id === c.id) {
      return state.item
    }
    return c
  })
  const localItem: L.Atom<TodoItem> = L.atom(itemToShow, editRequest.push)

  async function saveLocalChanges() {
    const currentItem = localItem.get()
    saveRequest.push(currentItem)
  }

  function cancelLocalChanges() {
    cancelRequest.push()
  }
  
  return (
    <span className={itemState}>
      <span className="name"><TextInput value={L.view(localItem, "name")} /></span>
      <Checkbox checked={L.view(localItem, "completed")}/>
      {
        L.view(itemState, s => s === "edit" ? <span className="controls">
            <a href="#" onClick={saveLocalChanges}>Save</a>
            <a href="#" onClick={cancelLocalChanges}>Cancel</a>
          </span>
        : null)
      }
    </span>
  );
};

const NewItem = () => {
  const disableNew: L.Property<boolean> = L.view(editState, state => state.state !== "view");
  const name = L.atom("")
  const addNew = () => addRequest.push(todoItem(name.get()))
  return (
    <div className="newItem">
      <TextInput placeholder="new item name" value={name} />
      <button disabled={disableNew} onClick={addNew}>Add new item</button>
    </div>
  );
};

const TextInput = (props: { value: L.Atom<string> } & any) => {
  return <input {...{ 
          type: "text", 
          onInput: e => { 
              props.value.set(e.currentTarget.value)
          },
          ...props, 
          value: props.value 
        }} />  
};

const Checkbox = (props: { checked: L.Atom<boolean> } & any) => {
    return <input {...{ 
            type: "checkbox", 
            onInput: e => { 
                props.checked.set(e.currentTarget.checked)
            },
            ...props, 
            checked: props.checked 
          }} />  
  };

function NotificationView({ notification }: { notification: L.Property<Notification | null> }) {
  return <span>{L.view(notification, notification => {
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
  })}</span>
}  
mount(<App/>, document.getElementById("root")!)