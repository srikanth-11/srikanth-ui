import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const STORAGE_KEY = "srikanth-ui-demo-consent"

const seed = () =>
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, timestamp: 1, consent: { necessary: true, analytics: true } })
  )

/** Fresh module instance, so the demo's load-time reset runs against this test's storage. */
async function mount() {
  vi.resetModules()
  const { CookieConsentDemo } = await import("./cookie-consent-demo")
  render(<CookieConsentDemo />)
}

describe("CookieConsentDemo", () => {
  beforeEach(() => localStorage.clear())

  it("shows the banner even when a choice from an earlier visit is stored", async () => {
    seed()
    await mount()
    // Without the reset the banner stays hidden forever: the gallery card mounts
    // this demo inert, so its own "Reset stored consent" button is unclickable
    // and the preview would be a permanently empty box.
    expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("still shows the banner on a clean visit", async () => {
    await mount()
    expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument()
  })
})
