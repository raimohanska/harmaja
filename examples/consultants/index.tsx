import * as L from "lonna"
import { globalScope } from "lonna";
import { h, mount, ListView } from "../../src/index"
import { Consultant, Id } from "./domain";
import { initialConsultants, randomConsultant, saveChangesToServer, ServerFeedEvent, listenToServerEvents } from "./server";
import "./styles.css";

type EditState = { state: "view" } | { state: "edit", consultant: Consultant } | { state: "saving", consultant: Consultant } | { state: "adding", consultant: Consultant }
type Notification = { type: "info" | "warning" | "error"; text: string };

const updates = L.bus<ServerFeedEvent>()
const saveRequest = L.bus<Consultant>()
const cancelRequest = L.bus<void>()
const editRequest = L.bus<Consultant>()
const addRequest = L.bus<Consultant>()

const saveResult = L.merge(saveRequest, addRequest).pipe(L.flatMap((consultant: Consultant) =>
  L.changes(L.fromPromise<void, Consultant | null>(saveChangesToServer(consultant), 
    () => null, // this never passes because only changes are monitored
    () => consultant, 
    error => null
  )),
  globalScope
));

const consultants: L.Property<Consultant []> = updates.pipe(L.scan(initialConsultants, reducer, globalScope))
const editState = L.update<EditState>(globalScope, { state: "view" }, 
  [addRequest, (_, consultant) => ({ state: "adding", consultant})],
  [editRequest, (_, consultant) => ({ state: "edit", consultant})],
  [saveRequest, (_, consultant) => ({ state: "saving", consultant})],
  [saveResult, (state, success) => (!success && state.state == "saving") ? { state: "edit", consultant: state.consultant } : { state: "view"}],
  [cancelRequest, () => ( { state: "view" })]
)
const saveFailed = saveResult.pipe(L.filter(success => !success))
const saveSuccess = saveResult.pipe(L.filter(success => !!success))
const notificationE: L.EventStreamSeed<Notification> = L.merge(
  L.view(saveFailed, () => ({ type: "error", text: "Failed to save"} as Notification)),
  L.view(saveSuccess, () => ({ type: "info", text: "Saved"} as Notification))
)
const notification: L.Property<Notification | null> = notificationE.pipe(
  L.flatMapLatest((notification: Notification | null) => L.later(2000, null).pipe(L.toProperty(notification))),
  L.toProperty(null, globalScope)
)

saveResult.forEach(savedConsultant => {
  if (savedConsultant) {
    updates.push({ type: "upsert", consultants: [ savedConsultant ]})
  }
})
listenToServerEvents(event => updates.push(event))

// Helper function for applying a batch of updates to a list of consultants
function applyUpdates(initialConsultants: Consultant[], updatedConsultants: Consultant[]): Consultant[] {
  return updatedConsultants.reduce((current: Consultant[], updatedConsultant: Consultant) => {
    const foundIndex = findIndex(current, c => c.id === updatedConsultant.id);
    if (foundIndex >= 0) {
      const updatedConsultants = [...current];
      updatedConsultants[foundIndex] = updatedConsultant;
      return updatedConsultants;
    } else {
      return [...current, updatedConsultant];
    }
  }, initialConsultants);
}

// Helper function to compute the next state of a consultant list given a new event from the server
function reducer(consultants: Consultant[], event: ServerFeedEvent) {
  switch (event.type) {
    case "init":
      return event.consultants;
    case "upsert":
      return applyUpdates(consultants, event.consultants);
    default:
      console.warn("Unknown event from server", event);
      return consultants;
  }
}


export default function App() {
  const disableNew = L.view(editState, state => state.state !== "view");
  
  return (
    <div className="App">
      <NotificationView {...{ notification }} />
      <h1>Fancy consultant CRM</h1>
      <ListView {...{
        observable: consultants,
        renderObservable: (id: Id, consultant: L.Property<Consultant>) => <ConsultantCard id={id} consultant={consultant} editState={editState}/>,
        getKey: (c: Consultant) => c.id
      }}/>
      
      <div style={{ display: "flex" }}>
        <button
          style={{ fontSize: "2em", marginTop: "0.5em" }}
          disabled={disableNew}
          onClick={async () => {            
            addRequest.push(randomConsultant())            
          }}
        >
          Add new
        </button>
      </div>
    </div>
  );
}

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

type CardState = "view" | "edit" | "disabled";

function ConsultantCard({ id, consultant, editState }: { id: Id, consultant: L.Property<Consultant>, editState: L.Property<EditState> }) {
  const cardState: L.Property<CardState> = L.combine(consultant, editState, (c, state) => {
    if (state.state === "edit") {
      if (state.consultant.id === c.id) {
        return "edit"
      }
      return "disabled"
    }
    if (state.state === "saving" || state.state === "adding") {
      return "disabled"
    }
    return "view"
  })
  const consultantToShow: L.Property<Consultant> = L.combine(consultant, editState, (c, state) => {
    if (state.state !== "view" && state.consultant.id === c.id) {
      return state.consultant
    }
    return c
  })
  const localConsultant: L.Atom<Consultant> = L.atom(consultantToShow, editRequest.push)

  async function saveLocalChanges() {
    const currentConsultant = localConsultant.get()
    saveRequest.push(currentConsultant)
  }

  function cancelLocalChanges() {
    cancelRequest.push()
  }
  
  return (
    <div
      style={L.view(cardState, s => { 
        const disabledStyle = (s === "disabled") ? { opacity: 0.5, pointerEvents: "none" as any /* TODO: really weird that this value is not accepted */ } : {}
        const style = {
          ...{
            display: "flex",
            margin: "1px",
            padding: "1px",
            border: "1px solid #eeeeee"
          },
          ...disabledStyle
        }
        return style
    })}
    >
      <img alt={L.view(localConsultant, "name")} src="profile-placeholder.png" style={{ maxWidth: "100px" }} />
      <div
        style={{
          display: "flex",
          padding: "1em",
          width: "100%",
          position: "relative"
        }}
      >
        <div style={{ position: "absolute", top: 0, right: 0 }}>
          {L.view(L.view(cardState, s => s === "edit"), editing => editing ? (
            <span>
              <SimpleButton
                {...{
                  onClick: saveLocalChanges,
                  text: "save"
                }}
              />
              &nbsp;
              <SimpleButton
                {...{
                  onClick: cancelLocalChanges,
                  text: "cancel"
                }}
              />
            </span>
          ) : (
            null
          ))}
        </div>
        <TextInput value={L.view(localConsultant, "name")} style={{ display: "inline-block", minWidth: "10em", border: "none" }} />
        <span style={{ marginLeft: "1em", textAlign: "left", width: "100%" }}>
          <Textarea
            value={L.view(localConsultant, "description")}            
            style={{
              height: "100%",
              width: "100%",
              display: "inline",
              border: "none"
            }}
          />
        </span>
      </div>
    </div>
  );
}


const TextInput = (props: { value: L.Atom<string>, elementName: string } & any) => {
  return <input {...{ 
          type: "text", 
          onInput: e => { 
              props.value.set(e.currentTarget.value)
          },
          ...props, 
          value: props.value 
        }} />  
};

const Textarea = (props: { value: L.Atom<string>, elementName: string } & any) => {
  return <textarea {...{ 
          onInput: e => { 
              props.value.set(e.currentTarget.value)
          },
          ...props, 
          value: props.value 
        }} />  
};


function SimpleButton({ text, onClick }: { text: string; onClick: () => any }) {
  return (
    <span style={{ color: "#5555ff", cursor: "pointer" }} onClick={onClick}>
      {text}
    </span>
  );
}

mount(<App/>, document.getElementById("root")!)


function findIndex<A>(xs: A[], predicate: (x: A) => boolean) {
  for (let i = 0; i < xs.length; i++) {
    if (predicate(xs[i])) return i
  }
  return -1
}