import { wait } from "../test-utils"
import * as B from "./eggs"

describe("merge", () => {
    it("two streams", async () => {
        const merged = B.merge(B.later(1, "a", B.globalScope), B.later(1, "b", B.globalScope))
        const values: string[] = []
        merged.forEach(value => values.push(value))
        await wait(2)
        expect(values).toEqual(["a", "b"])
    })
})