import * as B from "./eggs"
import * as A from "./atom"
import { globalScope, toProperty } from "./eggs"

describe("Property", () => {
    describe("Basics", () => {
        it ("Uses inheritance", () => {
            expect(B.constant(1) instanceof B.Property).toEqual(true)
            expect(B.constant(1) instanceof B.Observable).toEqual(true)
        })
    })

    it("scan", () => {
        const b = B.bus<number>()
        const prop = B.scan(b, 0, (a, b) => a + b, B.globalScope)
        const values: number[] = []
        const valuesChange: number[] = []
        prop.forEach(v => values.push(v))
        prop.on("change", v => valuesChange.push(v))
        expect(values).toEqual([0])
        expect(valuesChange).toEqual([])
        b.push(1)
        expect(values).toEqual([0, 1])
        expect(valuesChange).toEqual([1])
        b.push(1)
        expect(values).toEqual([0, 1, 2])
        expect(valuesChange).toEqual([1, 2])
    })

    it("map", () => {
        const b = B.constant(1)
        const b2 = B.map(b, x => x * 2)
        expect(b2.get()).toEqual(2)

        // TODO: test skipping duplicates

        // TODO: for Ostax: merge, or, not
    })
})
