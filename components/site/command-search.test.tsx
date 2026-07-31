import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommandSearch } from "./command-search"
import { registryMeta } from "@/lib/registry-meta"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const CATEGORY_HEADINGS = ["Form inputs", "Pickers & canvas", "Widgets", "Overlays"]

/** Exactly what the server header hands down — no Demo components across the boundary. */
const ITEMS = registryMeta.map(({ name, title, category }) => ({ name, title, category }))

const trigger = () => screen.getByRole("button", { name: /search components/i })

/** Ctrl+K anywhere on the page. Returns false when the handler called preventDefault. */
const pressCtrlK = () => fireEvent.keyDown(window, { key: "k", ctrlKey: true })

beforeEach(() => {
  push.mockClear()
})

describe("command search trigger", () => {
  it("shows the visible label and the ⌘K hint", () => {
    render(<CommandSearch items={ITEMS} />)

    expect(within(trigger()).getByText("Search components…")).toBeInTheDocument()
    expect(within(trigger()).getByText("⌘K")).toBeInTheDocument()
  })

  it("puts its visible label inside its accessible name (WCAG 2.5.3)", () => {
    render(<CommandSearch items={ITEMS} />)

    // Voice-control users say what they see, so "Search components…" has to lead.
    expect(trigger()).toHaveAccessibleName(/^Search components…/)
  })
})

describe("command palette", () => {
  it("opens on Ctrl+K, swallowing the browser's own shortcut", async () => {
    render(<CommandSearch items={ITEMS} />)
    expect(screen.queryByRole("dialog")).toBeNull()

    expect(pressCtrlK()).toBe(false)

    expect(await screen.findByRole("dialog")).toHaveAccessibleName(/search components/i)
  })

  it("labels the search input", async () => {
    render(<CommandSearch items={ITEMS} />)
    pressCtrlK()

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("combobox")).toHaveAccessibleName(/search components/i)
  })

  it("lists every component grouped under its category label", async () => {
    render(<CommandSearch items={ITEMS} />)
    pressCtrlK()

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getAllByRole("option")).toHaveLength(registryMeta.length)
    for (const heading of CATEGORY_HEADINGS) {
      expect(within(dialog).getByRole("group", { name: heading })).toBeInTheDocument()
    }
  })

  it("filters to the matching component as you type", async () => {
    const user = userEvent.setup()
    render(<CommandSearch items={ITEMS} />)

    await user.click(trigger())
    await user.type(await screen.findByRole("combobox"), "kan")

    expect(await screen.findByRole("option", { name: /kanban/i })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole("option", { name: /time picker/i })).toBeNull()
    )
  })

  it("navigates to the component docs and closes on select", async () => {
    const user = userEvent.setup()
    render(<CommandSearch items={ITEMS} />)

    await user.click(trigger())
    await user.type(await screen.findByRole("combobox"), "kan")
    await user.keyboard("{Enter}")

    expect(push).toHaveBeenCalledWith("/docs/kanban")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("closes on Escape", async () => {
    const user = userEvent.setup()
    render(<CommandSearch items={ITEMS} />)

    await user.click(trigger())
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(push).not.toHaveBeenCalled()
  })

  it("removes its global keydown listener on unmount", () => {
    const add = vi.spyOn(window, "addEventListener")
    const remove = vi.spyOn(window, "removeEventListener")

    const { unmount } = render(<CommandSearch items={ITEMS} />)
    const added = add.mock.calls.filter(([type]) => type === "keydown").map(([, fn]) => fn)
    unmount()
    const removed = remove.mock.calls.filter(([type]) => type === "keydown").map(([, fn]) => fn)

    expect(added).toHaveLength(1)
    expect(removed).toEqual(added)
    add.mockRestore()
    remove.mockRestore()
  })
})
