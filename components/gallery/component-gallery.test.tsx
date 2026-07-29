import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { registryMeta } from "@/lib/registry-meta"
import { ComponentGallery } from "./component-gallery"
import { LazyPreview } from "./lazy-preview"

// happy-dom has no IntersectionObserver, so every LazyPreview stays a skeleton here —
// which is what we want: the gallery's own chrome is under test, not twelve demos.
const cards = () => screen.getAllByRole("button", { name: /open .+ preview/i })
const search = () => screen.getByRole("searchbox", { name: /search/i })

describe("ComponentGallery", () => {
  it("renders one card per registry entry with an accessible open button", () => {
    render(<ComponentGallery />)
    expect(cards()).toHaveLength(registryMeta.length)
    expect(screen.getByRole("button", { name: "Open Kanban preview" })).toBeInTheDocument()
  })

  it("search narrows cards and shows the empty state on no match", async () => {
    const user = userEvent.setup()
    render(<ComponentGallery />)

    await user.type(search(), "kanban")
    expect(cards()).toHaveLength(1)

    await user.clear(search())
    await user.type(search(), "zzz")
    expect(screen.queryAllByRole("button", { name: /open .+ preview/i })).toHaveLength(0)
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
    expect(screen.queryAllByRole("button", { name: /open .+ preview/i })).toHaveLength(0)
    expect(screen.getByText(/no components match/i)).toBeInTheDocument()
  })

  it("card click opens the modal with title, steps, install command, docs link", async () => {
    const user = userEvent.setup()
    render(<ComponentGallery />)
    const kanban = registryMeta.find((entry) => entry.name === "kanban")!

    await user.click(screen.getByRole("button", { name: "Open Kanban preview" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(kanban.title)).toBeInTheDocument()
    expect(within(dialog).getByRole("heading", { name: /how to use/i })).toBeInTheDocument()
    for (const step of kanban.howToUse) {
      expect(within(dialog).getByText(step)).toBeInTheDocument()
    }
    expect(within(dialog).getByText(/\/r\/kanban\.json/)).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: /full docs/i })).toHaveAttribute(
      "href",
      "/docs/kanban"
    )
  })

  it("Escape closes the modal and focus returns to the opening card", async () => {
    const user = userEvent.setup()
    render(<ComponentGallery />)
    const card = screen.getByRole("button", { name: "Open Kanban preview" })

    await user.click(card)
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    await waitFor(() => expect(card).toHaveFocus())
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
