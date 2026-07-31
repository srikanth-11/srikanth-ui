import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DocsSidebar } from "./docs-sidebar"
import { registryIndex, type ComponentCategory } from "@/lib/registry-index"

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/docs/kanban",
}))

/** The four labels, spelled out here rather than imported — the strings are the contract. */
const GROUPS: [ComponentCategory, string][] = [
  ["form", "Form inputs"],
  ["picker", "Pickers & canvas"],
  ["widget", "Widgets"],
  ["overlay", "Overlays"],
]

const nav = () => screen.getByRole("navigation", { name: /components/i })

describe("docs sidebar", () => {
  it("links to every component in the registry", () => {
    render(<DocsSidebar />)

    const links = within(nav()).getAllByRole("link")
    expect(links).toHaveLength(registryIndex.length)
    expect(links.map((link) => link.getAttribute("href")).sort()).toEqual(
      registryIndex.map((entry) => `/docs/${entry.name}`).sort()
    )
  })

  it("groups them under the four category headings", () => {
    render(<DocsSidebar />)

    for (const [category, label] of GROUPS) {
      const group = screen.getByRole("heading", { name: label }).closest("li")
      expect(group, label).not.toBeNull()
      expect(within(group!).getAllByRole("link").map((link) => link.textContent)).toEqual(
        registryIndex.filter((entry) => entry.category === category).map((entry) => entry.title)
      )
    }
  })

  it("marks the current page's link, and only that one", () => {
    render(<DocsSidebar />)

    const current = within(nav())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page")

    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute("href", "/docs/kanban")
  })
})
