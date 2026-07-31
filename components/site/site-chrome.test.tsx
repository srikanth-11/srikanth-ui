import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Providers } from "./providers"
import { SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"

const GITHUB = "https://github.com/srikanth-11/srikanth-ui"

// The header's search is the command palette now, and it reaches for the router.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

/** next-themes reads matchMedia and writes the class on <html>, so chrome renders below the provider. */
function renderChrome(ui: React.ReactNode) {
  return render(<Providers>{ui}</Providers>)
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})

describe("site header", () => {
  it("links to home, the gallery, and GitHub", () => {
    renderChrome(<SiteHeader />)

    expect(screen.getByRole("link", { name: /srikanth\/ui/i })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: /^components$/i })).toHaveAttribute(
      "href",
      "/components"
    )
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", GITHUB)
  })

  it("renders the search button and the theme toggle", () => {
    renderChrome(<SiteHeader />)

    expect(screen.getByRole("button", { name: /search components/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument()
  })

  it("renders both theme icons, so the markup never depends on the resolved theme", () => {
    renderChrome(<SiteHeader />)

    // A toggle that rendered one icon per theme would mismatch on hydration; CSS picks.
    expect(screen.getByRole("button", { name: /theme/i }).querySelectorAll("svg")).toHaveLength(2)
  })

  it("puts the document in dark mode when the toggle is clicked", async () => {
    const user = userEvent.setup()
    renderChrome(<SiteHeader />)

    await user.click(screen.getByRole("button", { name: /theme/i }))

    expect(document.documentElement).toHaveClass("dark")
  })
})

describe("site footer", () => {
  it("credits shadcn/ui and links to GitHub", () => {
    renderChrome(<SiteFooter />)

    expect(screen.getByText(/built on shadcn\/ui/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", GITHUB)
  })
})
