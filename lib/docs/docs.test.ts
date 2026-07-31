import { describe, expect, it } from "vitest"
import { registryMeta } from "@/lib/registry-meta"
import { componentDocs } from "./index"

// The names whose docs content exists today. Grows to every registryMeta name as
// the remaining components are written up; the rules below already apply to every
// entry in componentDocs, so new entries are covered the moment they land.
const DOCUMENTED = [
  "time-picker",
  "phone-input",
  "password-input",
  "number-input",
  "color-picker",
  "signature-pad",
  "image-cropper",
]

describe("componentDocs", () => {
  it("has an entry for every documented component", () => {
    for (const name of DOCUMENTED) expect(componentDocs[name], name).toBeDefined()
  })

  it("gives every entry exports, prop rows and a usable example", () => {
    for (const [name, doc] of Object.entries(componentDocs)) {
      expect(doc.exports.length, name).toBeGreaterThan(0)

      // The first export is the main component — the props table nobody can skip.
      expect(doc.exports[0].props.length, name).toBeGreaterThan(0)

      for (const docExport of doc.exports) {
        expect(docExport.name.trim(), name).not.toBe("")
        for (const row of docExport.props) {
          const where = `${name} › ${docExport.name}.${row.name}`
          expect(row.name.trim(), where).not.toBe("")
          expect(row.type.trim(), where).not.toBe("")
          expect(row.description.trim(), where).not.toBe("")
        }
      }

      expect(doc.examples.length, name).toBeGreaterThan(0)
      for (const example of doc.examples) expect(example.title.trim(), name).not.toBe("")
      // An example that never mentions the component isn't a usage example.
      expect(
        doc.examples.some((example) => example.code.includes(doc.exports[0].name)),
        name
      ).toBe(true)
    }
  })

  it("explains the error state wherever an invalid demo is rendered", () => {
    for (const entry of registryMeta) {
      const doc = componentDocs[entry.name]
      if (!entry.InvalidDemo || !doc) continue
      expect(doc.errorState?.trim(), entry.name).toBeTruthy()
    }
  })
})
