import { TodoItem, todoItem } from "./domain";
import * as B from "baconjs"

export type InitTodos = {
  type: "init";
  items: TodoItem[];
};
export type UpsertTodos = {
  type: "upsert";
  items: TodoItem[];
};
export type ServerFeedEvent = InitTodos | UpsertTodos;

const initialItems = ["learn typescript", "fix handbrake"].map(name => todoItem(name));

const moreItems = [
  "buy beer",
  "clean the house",
  "fix the bike",
  "get a lawyer",
  "buy a new shovel",
  "dispose of the corpses in garage",
  "get a haircut",
  "shave more often",
  "post something smart on twitter",
  "understand monad transformers",
  "blow up some things",
  "have fun",
  "visit new reaktor HQ"
];

let storedItems: TodoItem[] = initialItems;

function serverFeed(): B.EventStream<ServerFeedEvent> {
  console.log("Start server feed");
  storedItems = initialItems;
  const b = new B.Bus<ServerFeedEvent>();

  (async () => {
    await randomDelay(2000);

    b.push({
      type: "init",
      items: storedItems
    });
  
    while (true) {
      await randomDelay(10000);
      if (Math.random() < 0.3) {
        const index = randomIndex(storedItems);
        const existingItem = storedItems[index];
        const updated = {
          ...existingItem,
          completed: !existingItem.completed
        };
        //console.log("Updating existing", existingConsultant, "to", updated);
        storedItems[index] = updated;
        b.push({
          type: "upsert",
          items: [updated]
        });
      } else {
        const newItem = randomItem();
        storedItems.push(newItem);
        b.push({ type: "upsert", items: [newItem] });
      }
    }  
  })()

  return b
}

export async function listenToServerEvents(
  listener: (e: ServerFeedEvent) => any
) {
  serverFeed().forEach(listener)
}

export async function saveChangesToServer(
  item: TodoItem
): Promise<void> {
  await randomDelay(2000);
  if (Math.random() < 0.1)
    throw new Error("Oops, random error occurred on server");
  const index = findIndex(storedItems, c => c.id === item.id);
  if (index < 0) {
    storedItems.push(item);
    console.log("Insert", item);
  } else {
    storedItems[index] = item;
    console.log("Update", item);
  }
}

function randomDelay(max: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, Math.random() * max);
  });
}

function randomIndex(options: any[]) {
  return Math.floor(Math.random() * options.length);
}
const randomItem = () => todoItem(moreItems[randomIndex(moreItems)])

export function findIndex<A>(xs: A[], predicate: (x: A) => boolean) {
  for (let i = 0; i < xs.length; i++) {
    if (predicate(xs[i])) return i
  }
  return -1
}