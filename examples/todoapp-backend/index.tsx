import { h, mount, ListView, Signal, atomFromValue, Atom, combineSignals, atomFromSignalAndSetter } from "../../src/index"
import { todoItem, TodoItem, Id } from "./domain";
import { saveChangesToServer, ServerFeedEvent, listenToServerEvents, findIndex } from "./server";

type EditState = { state: "view" } | { state: "edit", item: TodoItem } | { state: "saving", item: TodoItem } | { state: "adding", item: TodoItem }
type Notification = { type: "info" | "warning" | "error"; text: string };

const editState = atomFromValue<EditState>({ state: "view" })
const notificationState = atomFromValue<Notification | null>(null)

function saveToServer(item: TodoItem) {
  saveChangesToServer(item).catch((e) => {
    // Failed to save
    console.error("Failed to save", e)
    editState.set({ state: "view" })
    showNotification({ type: "error", text: "Failed to save" })
  }).then(() => {
    // Successful save
    showNotification({ type: "info", text: "Saved" })
    editState.set({ state: "view" })
    dispatch({ type: "upsert", items: [ item ]})
  })
}

function save(item: TodoItem) {
  editState.set({ state: "saving", item })
  saveToServer(item)
}
function add(item: TodoItem) {
  editState.set({ state: "adding", item })
  saveToServer(item)
}
function edit(item: TodoItem) {
  editState.set({ state: "edit", item })
}

function cancel() {
  editState.set({ state: "view" })
}

function showNotification(notification: Notification) {
  notificationState.set(notification)
  setTimeout(() => notificationState.set(null), 2000)
}

const allItems = atomFromValue<TodoItem[]>([])

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
const dispatch = (event: ServerFeedEvent) => allItems.modify(items => reducer(items, event))
listenToServerEvents(dispatch)


const App = () => {
  return (
    <div>
      <NotificationView {...{ notification: notificationState }} />
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
const ItemList = ({ items }: { items: Signal<TodoItem[]>}) => {
  return (
    <ul>
      {/* when using this variant of ListView (renderItem) the items
          will be completely replaced with changed (based on the given `equals`) */}
      <ListView 
        observable={items} 
        renderObservable={(id: number, item: Signal<TodoItem>) => <li><ItemView id={id} item={item} editState={editState}/></li>}
        getKey={ item => item.id }
      />
    </ul>
  );
};

type ItemState = "view" | "edit" | "disabled";
const ItemView = ({ id, item, editState }: { id: number, editState: Signal<EditState>, item: Signal<TodoItem> }) => {  
  const itemState: Signal<ItemState> = combineSignals([item, editState], (c, state) => {
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
  const itemToShow: Signal<TodoItem> = combineSignals([item, editState], (c, state) => {
    if (state.state !== "view" && state.item.id === c.id) {
      return state.item
    }
    return c
  })
  const localItem: Atom<TodoItem> = atomFromSignalAndSetter(itemToShow, edit)

  async function saveLocalChanges() {
    const currentItem = localItem.get()
    save(currentItem)
  }

  function cancelLocalChanges() {
    cancel()
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
  const disableNew: Signal<boolean> = editState.map(state => state.state !== "view");
  const name = atomFromValue("")
  const addNew = () => add(todoItem(name.get()))
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

function NotificationView({ notification }: { notification: Signal<Notification | null> }) {
  return <span>{notification.map(notification => {
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