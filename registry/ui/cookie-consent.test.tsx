import { fireEvent, render, screen } from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CookieConsent, getStoredConsent, type CookieCategory } from "./cookie-consent"

const CATEGORIES: CookieCategory[] = [
  {
    id: "necessary",
    label: "Strictly necessary",
    description: "Required for the site to work.",
    required: true,
  },
  { id: "analytics", label: "Analytics", description: "Helps us understand usage." },
  { id: "marketing", label: "Marketing" },
]

const KEY = "cookie-consent"

function seed(consent: Record<string, boolean>, version = 1) {
  localStorage.setItem(KEY, JSON.stringify({ version, timestamp: 123, consent }))
}

const banner = () => screen.queryByRole("region", { name: "Cookie consent" })

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("CookieConsent", () => {
  it("shows the banner when nothing is stored", () => {
    const onConsent = vi.fn()
    render(
      <CookieConsent
        categories={CATEGORIES}
        onConsent={onConsent}
        policyHref="/cookies"
      />
    )

    expect(banner()).toBeInTheDocument()
    expect(onConsent).not.toHaveBeenCalled()
    expect(screen.getByRole("link", { name: /cookie policy/i })).toHaveAttribute(
      "href",
      "/cookies"
    )
  })

  it("hides the banner and replays stored consent on mount", () => {
    seed({ analytics: true, marketing: false })
    const onConsent = vi.fn()

    render(<CookieConsent categories={CATEGORIES} onConsent={onConsent} />)

    expect(banner()).not.toBeInTheDocument()
    expect(onConsent).toHaveBeenCalledTimes(1)
    expect(onConsent).toHaveBeenCalledWith({
      necessary: true,
      analytics: true,
      marketing: false,
    })
  })

  it("accepts all: emits every category true, persists, and unmounts the banner", () => {
    const onConsent = vi.fn()
    render(<CookieConsent categories={CATEGORIES} onConsent={onConsent} />)

    fireEvent.click(screen.getByRole("button", { name: /accept all/i }))

    expect(onConsent).toHaveBeenCalledWith({
      necessary: true,
      analytics: true,
      marketing: true,
    })
    expect(banner()).not.toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(KEY)!)
    expect(stored.version).toBe(1)
    expect(typeof stored.timestamp).toBe("number")
    expect(stored.consent).toEqual({
      necessary: true,
      analytics: true,
      marketing: true,
    })
  })

  it("rejects: required categories stay true, the rest go false", () => {
    const onConsent = vi.fn()
    render(<CookieConsent categories={CATEGORIES} onConsent={onConsent} />)

    fireEvent.click(screen.getByRole("button", { name: /reject/i }))

    expect(onConsent).toHaveBeenCalledWith({
      necessary: true,
      analytics: false,
      marketing: false,
    })
    expect(banner()).not.toBeInTheDocument()
  })

  it("saves per-category choices from the preferences dialog", () => {
    const onConsent = vi.fn()
    render(<CookieConsent categories={CATEGORIES} onConsent={onConsent} />)

    fireEvent.click(screen.getByRole("button", { name: /preferences/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    const required = screen.getByRole("switch", { name: /strictly necessary/i })
    expect(required).toBeDisabled()
    expect(required).toBeChecked()

    fireEvent.click(screen.getByRole("switch", { name: /analytics/i }))
    fireEvent.click(screen.getByRole("button", { name: /^save/i }))

    expect(onConsent).toHaveBeenCalledWith({
      necessary: true,
      analytics: true,
      marketing: false,
    })
    expect(banner()).not.toBeInTheDocument()
  })

  it("re-prompts when the consent version is bumped", () => {
    seed({ analytics: true }, 1)
    const onConsent = vi.fn()

    render(<CookieConsent categories={CATEGORIES} onConsent={onConsent} version={2} />)

    expect(banner()).toBeInTheDocument()
    expect(onConsent).not.toHaveBeenCalled()
    expect(getStoredConsent(KEY, 2)).toBeNull()
    expect(getStoredConsent(KEY, 1)).toEqual({ analytics: true })
  })

  it("honours a custom storage key", () => {
    render(<CookieConsent categories={CATEGORIES} storageKey="ck" />)

    fireEvent.click(screen.getByRole("button", { name: /accept all/i }))

    expect(localStorage.getItem(KEY)).toBeNull()
    expect(getStoredConsent("ck")).toEqual({
      necessary: true,
      analytics: true,
      marketing: true,
    })
  })

  it("renders the banner without crashing when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    const onConsent = vi.fn()

    render(<CookieConsent categories={CATEGORIES} onConsent={onConsent} />)
    expect(banner()).toBeInTheDocument()

    // A blocked write must still apply the choice for this session.
    fireEvent.click(screen.getByRole("button", { name: /accept all/i }))
    expect(onConsent).toHaveBeenCalledWith({
      necessary: true,
      analytics: true,
      marketing: true,
    })
    expect(banner()).not.toBeInTheDocument()
  })

  it("never touches localStorage during render (SSR-safe)", () => {
    seed({ analytics: true })
    const getItem = vi.spyOn(Storage.prototype, "getItem")

    // Server render: no effects run, so a storage read here would be a read
    // during render — and would hydrate-mismatch against the client.
    const html = renderToStaticMarkup(<CookieConsent categories={CATEGORIES} />)

    expect(getItem).not.toHaveBeenCalled()
    expect(html).not.toMatch(/Cookie consent/)
  })
})

describe("getStoredConsent", () => {
  it("returns the stored consent for a matching version", () => {
    seed({ analytics: true, marketing: false })
    expect(getStoredConsent()).toEqual({ analytics: true, marketing: false })
  })

  it("returns null when nothing is stored", () => {
    expect(getStoredConsent()).toBeNull()
  })

  it("returns null on corrupt JSON without throwing", () => {
    localStorage.setItem(KEY, "{not json")
    expect(() => getStoredConsent()).not.toThrow()
    expect(getStoredConsent()).toBeNull()
  })

  it("returns null when the payload has no consent object", () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, timestamp: 1 }))
    expect(getStoredConsent()).toBeNull()
    localStorage.setItem(KEY, JSON.stringify("nope"))
    expect(getStoredConsent()).toBeNull()
  })

  it("returns null when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    expect(getStoredConsent()).toBeNull()
  })
})
