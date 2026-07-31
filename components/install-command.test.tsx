import fs from "node:fs"
import { describe, expect, it } from "vitest"
import { REGISTRIES_CONFIG } from "./install-command"

describe("install command", () => {
  // The site and the README hand out the same namespace config, and the two are
  // edited months apart. Pin them together so a change to one fails here.
  it("prints the registries config exactly as the README does", () => {
    expect(fs.readFileSync("README.md", "utf8")).toContain(REGISTRIES_CONFIG)
  })
})
