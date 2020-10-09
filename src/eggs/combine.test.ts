import { combine } from "./combine"
import { constant } from "./property"

describe("Combine", () => {
    it("Different arities", () => {
        expect(combine (() => 0).get()).toEqual(0)
        expect(combine(constant(1), x => x * 2).get()).toEqual(2)
        expect(combine(constant(1), constant(2), (x, y) => x * y).get()).toEqual(2)
        expect(combine(constant(1), constant(2), constant(3), (x, y, z) => x * y * z).get()).toEqual(6)
    })
})