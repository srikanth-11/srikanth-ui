import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { registryMeta } from "@/lib/registry-meta"
import { ComponentGallery } from "./component-gallery"
import { LazyPreview } from "./lazy-preview"

// happy-dom has no IntersectionObserver, so every LazyPreview stays a skeleton here —
// which is what we want: the gallery's own chrome is under test, not twelve demos.
const cards = () => screen.getAllByRole("link", { name: /open .+ docs/i })
const search = () => screen.getByRole("searchbox", { name: /search/i })

describe("ComponentGallery", () => {
  it("gives every card a named link to that component's docs page", () => {
    render(<ComponentGallery />)
    expect(cards()).toHaveLength(registryMeta.length)
    for (const { name, title } of registryMeta) {
      expect(screen.getByRole("link", { name: `Open ${title} docs` })).toHaveAttribute(
        "href",
        `/docs/${name}`
      )
    }
  })

  it("pins the filter bar below the sticky site header, not under it", () => {
    render(<ComponentGallery />)
    // SiteHeader is `sticky top-0` and `h-14`; top-0 here would hide the search box behind it.
    expect(search().closest("div")).toHaveClass("sticky", "top-14")
  })

  it("search narrows cards and shows the empty state on no match", async () => {
    const user = userEvent.setup()
    render(<ComponentGallery />)

    await user.type(search(), "kanban")
    expect(cards()).toHaveLength(1)

    await user.clear(search())
    await user.type(search(), "zzz")
    expect(screen.queryAllByRole("link", { name: /open .+ docs/i })).toHaveLength(0)
    expect(screen.getByText(/no components match/i)).toBeInTheDocument()
  })

  it("category pill filters to that category and composes with search", async () => {
    const user = userEvent.setup()
    render(<ComponentGallery />)
    const widgets = registryMeta.filter((entry) => entry.category === "widget")

    const pill = screen.getByRole("button", { name: "Widgets" })
    await user.click(pill)
    expect(pill).toHaveAttribute("aria-pressed", "true")
    expect(cards()).toHaveLength(widgets.length)

    // Pill AND search, not pill OR search.
    await user.type(search(), "kanban")
    expect(cards()).toHaveLength(1)

    await user.clear(search())
    await user.type(search(), "phone") // a form component, so nothing survives the pill
    expect(screen.queryAllByRole("link", { name: /open .+ docs/i })).toHaveLength(0)
    expect(screen.getByText(/no components match/i)).toBeInTheDocument()
  })

  // Modal-content test deleted: cards navigate to /docs/<name> now — app/docs-page.test.tsx owns title/steps/install.
  // Steps-dedupe test deleted: the cropper demo no longer renders its own `<ol>`, so there is nothing to dedupe.
  // Escape/focus-return test deleted: no dialog to close, and a link needs no focus restoration.

  it("marks the card named by the hash, on mount and on hashchange", () => {
    // A wall tile on the landing page navigates with pushState, which leaves
    // `:target` unset — so the mark is an attribute the gallery writes itself.
    window.location.hash = "#kanban"
    render(<ComponentGallery />)
    expect(document.getElementById("kanban")).toHaveAttribute("data-highlight")
    // …and lands clear of the sticky stack: the filter bar pins at 56px and is
    // 144px tall when the pill row wraps on a phone, so the stack ends at 200px,
    // and the 2px/3px-offset highlight ring puts the floor at 205 — 208px (13rem).
    expect(document.getElementById("kanban")).toHaveClass("scroll-mt-52")

    act(() => {
      window.location.hash = "#color-picker"
      window.dispatchEvent(new Event("hashchange"))
    })
    expect(document.getElementById("color-picker")).toHaveAttribute("data-highlight")
    expect(document.getElementById("kanban")).not.toHaveAttribute("data-highlight")

    window.location.hash = ""
  })
})

describe("LazyPreview", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("holds a skeleton with no IntersectionObserver, then mounts the preview inert", () => {
    let fire: (() => void) | undefined
    const disconnect = vi.fn()
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          fire = () => callback([{ isIntersecting: true }])
        }
        observe() {}
        disconnect = disconnect
      }
    )

    render(
      <LazyPreview previewHeightClass="h-40">
        <button type="button">Inside the preview</button>
      </LazyPreview>
    )
    expect(screen.queryByRole("button")).toBeNull()

    act(() => fire!())
    const inside = screen.getByText("Inside the preview")
    expect(inside.closest("[inert]")).toHaveAttribute("aria-hidden", "true")
    expect(disconnect).toHaveBeenCalled()
  })
})
