import { sentences } from "./sentences"

export async function search(query: string): Promise<string[]> {
    console.log("Searching", query)
    await randomDelay(1000)
    return sentences.filter((sentence) =>
        sentence.toLowerCase().includes(query.toLowerCase())
    )
}

function randomDelay(max: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, Math.random() * max)
    })
}
