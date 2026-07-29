import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { registryMeta, SITE_URL } from "@/lib/registry-meta"
import Home from "./page"

const INSTALL = `npx shadcn@latest add ${SITE_URL}/r/time-picker.json`
const GITHUB = "https://github.com/srikanth-11/srikanth-ui"

describe("landing page", () => {
  it("renders the hero headline, install command, and both CTAs", () => {
    render(<Home />)

    expect(
      screen.getByRole("heading", { level: 1, name: /the components shadcn\/ui doesn't ship/i })
    ).toBeInTheDocument()
    expect(screen.getAllByText(INSTALL).length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: /browse components/i })).toHaveAttribute(
      "href",
      "/components"
    )
    const github = screen.getAllByRole("link", { name: /github/i })
    expect(github.length).toBeGreaterThan(0)
    for (const link of github) {
      expect(link).toHaveAttribute("href", GITHUB)
    }
  })

  it("mounts exactly three showcase demos", () => {
    render(<Home />)
    expect(screen.getAllByTestId("showcase-demo")).toHaveLength(3)
  })

  it("renders a wall tile linking to /components#<name> for every registry entry", () => {
    const { container } = render(<Home />)

    for (const { name, title } of registryMeta) {
      const tile = container.querySelector(`a[href="/components#${name}"]`)
      expect(tile, `no wall tile for ${name}`).not.toBeNull()
      expect(tile).toHaveTextContent(title)
    }
    // One tile per entry, not two.
    expect(container.querySelectorAll('a[href^="/components#"]')).toHaveLength(registryMeta.length)
  })

  it("announces the copied state when the install command is copied", async () => {
    const user = userEvent.setup()
    render(<Home />)

    await user.click(screen.getAllByRole("button", { name: /copy install command/i })[0])
    expect(await screen.findByText("Copied")).toBeInTheDocument()
  })
})
