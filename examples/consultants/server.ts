import { Consultant } from "./domain"
import { randomName } from "./names"
import { sentences } from "./sentences"
import * as L from "lonna"

export type InitConsultants = {
    type: "init"
    consultants: Consultant[]
}
export type UpsertConsultants = {
    type: "upsert"
    consultants: Consultant[]
}
export type ServerFeedEvent = InitConsultants | UpsertConsultants

let counter = 0

export const initialConsultants = generate(3, randomConsultant)

let consultants: Consultant[] = initialConsultants

function serverFeed(): L.EventStream<ServerFeedEvent> {
    console.log("Start server feed")
    consultants = generate(3, randomConsultant)
    const b = L.bus<ServerFeedEvent>()

    ;(async () => {
        await randomDelay(2000)

        b.push({
            type: "init",
            consultants: consultants,
        })

        while (true) {
            await randomDelay(10000)
            if (Math.random() < 0.95) {
                const index = randomIndex(consultants)
                const existingConsultant = consultants[index]
                const updated = {
                    ...existingConsultant,
                    description: randomDescription(),
                }
                //console.log("Updating existing", existingConsultant, "to", updated);
                consultants[index] = updated
                b.push({
                    type: "upsert",
                    consultants: [updated],
                })
            } else {
                const newConsultant = randomConsultant()
                consultants.push(newConsultant)
                b.push({ type: "upsert", consultants: [newConsultant] })
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
    consultant: Consultant
): Promise<void> {
    await randomDelay(2000)
    if (Math.random() < 0.5) {
        console.log("Throwing random error")
        throw new Error("Oops, random error occurred on server")
    }
    const index = findIndex(consultants, (c) => c.id === consultant.id)
    if (index < 0) {
        consultants.push(consultant)
        console.log("Insert", consultant)
    } else {
        consultants[index] = consultant
        console.log("Update", consultant)
    }
}

function randomDelay(max: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, Math.random() * max)
    })
}

export function randomConsultant(): Consultant {
    return {
        id: "" + counter++,
        name: randomName(),
        description: randomDescription(),
    }
}

function randomDescription() {
    return generate(5, () => randomFrom(sentences)).join(" ")
}

function generate<T>(count: number, generator: () => T) {
    return [...Array(count)].map((_) => generator())
}

function randomFrom<T>(options: T[]) {
    return options[randomIndex(options)]
}

function randomIndex(options: any[]) {
    return Math.floor(Math.random() * options.length)
}

function findIndex<A>(xs: A[], predicate: (x: A) => boolean) {
    for (let i = 0; i < xs.length; i++) {
        if (predicate(xs[i])) return i
    }
    return -1
}
