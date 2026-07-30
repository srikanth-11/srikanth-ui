import { cleanup, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { CookieConsentDemo } from "./cookie-consent-demo"

const STORAGE_KEY = "srikanth-ui-demo-consent"

const seed = () =>
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, timestamp: 1, consent: { necessary: true, analytics: true } })
  )

const banner = () => screen.queryByRole("region", { name: "Cookie consent" })

describe("CookieConsentDemo", () => {
  beforeEach(() => localStorage.clear())

  it("shows the banner on every mount, not just the first of the page", () => {
    // Both renders below share one module instance, which is the case that matters:
    // the gallery unmounts and remounts this card as the filters change and never
    // reloads the page, so forgetting the stored choice once per module load leaves
    // the second mount reading it back. The card preview is inert, so its own
    // "Reset stored consent" button can't undo that — it would just be an empty box.
    seed()
    render(<CookieConsentDemo />)
    expect(banner()).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    cleanup()
    seed()
    render(<CookieConsentDemo />)
    expect(banner()).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("still shows the banner on a clean visit", () => {
    render(<CookieConsentDemo />)
    expect(banner()).toBeInTheDocument()
  })
})
