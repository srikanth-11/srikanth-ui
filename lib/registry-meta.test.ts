import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { registryMeta } from "./registry-meta"

const CATEGORIES = ["form", "picker", "widget", "overlay"] as const

describe("registryMeta", () => {
  it("binds a demo to every indexed component", () => {
    // The metadata and the demo components live in separate modules so that naming a
    // component doesn't ship one; this is the seam where a new entry can miss its demo.
    for (const entry of registryMeta) expect(entry.Demo, entry.name).toBeTypeOf("function")
  })

  it("keeps the other half of the seam, registry-index, import-free", () => {
    // Only reading the file enforces what its header comment promises. A single
    // `import { KanbanDemo }` there hands dnd-kit, react-easy-crop and
    // libphonenumber to every route that renders the navbar — 374 KB of it.
    // Path from the root, not import.meta.url: vitest serves modules over http,
    // so that URL is not a file: one and readFileSync rejects it.
    const source = readFileSync("lib/registry-index.ts", "utf8")
    expect(source).not.toMatch(/^import /m)
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
