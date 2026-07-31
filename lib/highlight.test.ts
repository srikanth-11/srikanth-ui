import { describe, expect, it, vi } from "vitest"
import * as shiki from "shiki"
import { highlight } from "./highlight"

// Real shiki, wrapped in spies. The caching assertion below is about how many
// highlighters this module builds, not about stubbing the highlighting itself —
// the markup assertions need the genuine output.
vi.mock("shiki", { spy: true })

describe("highlight", () => {
  it("emits dual-theme shiki markup with the source escaped", async () => {
    const html = await highlight('const x = <Button variant="outline">Hi</Button>')

    // `class="shiki shiki-themes github-light github-dark"` — the themes are
    // appended, so match the class list rather than an exact attribute.
    expect(html).toMatch(/<pre class="shiki[ "]/)
    expect(html).toContain("--shiki-light:")
    expect(html).toContain("--shiki-dark:")
    // shiki escapes `<` as `&#x3C;`, so no raw tag reaches the DOM we inject.
    expect(html).not.toContain("<Button")
    expect(html).toContain("&#x3C;")
  })

  it("builds the highlighter once, however many times it is called", async () => {
    await highlight("const a = 1")
    await highlight("const b = 2")

    expect(vi.mocked(shiki.createHighlighter)).toHaveBeenCalledTimes(1)
  })
})
