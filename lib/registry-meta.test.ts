import { describe, expect, it } from "vitest"
import { registryMeta } from "./registry-meta"

const CATEGORIES = ["form", "picker", "widget", "overlay"] as const

describe("registryMeta", () => {
  it("binds a demo to every indexed component", () => {
    // The metadata and the demo components live in separate modules so that naming a
    // component doesn't ship one; this is the seam where a new entry can miss its demo.
    for (const entry of registryMeta) expect(entry.Demo, entry.name).toBeTypeOf("function")
  })

  it("gives every component a category and 2-4 plain-language howToUse steps", () => {
    for (const entry of registryMeta) {
      expect(CATEGORIES, entry.name).toContain(entry.category)
      expect(entry.howToUse.length, entry.name).toBeGreaterThanOrEqual(2)
      expect(entry.howToUse.length, entry.name).toBeLessThanOrEqual(4)
      for (const step of entry.howToUse) expect(step.trim().length, entry.name).toBeGreaterThan(10)
    }
  })
})
