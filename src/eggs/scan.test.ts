import * as B from "./eggs"

describe("Property", () => {
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
})
