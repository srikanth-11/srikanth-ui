import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TourProvider, getSpotlightRect, useTour, type TourStep } from "./onboarding-tour"

const STEPS: TourStep[] = [
  { id: "one", target: "#one", title: "The sidebar", content: "Everything lives here." },
  { id: "two", target: "#two", title: "The editor", content: "Type your notes." },
  { id: "three", target: "#three", title: "Publish", content: "Ship it.", side: "top" },
]

const KEY = "tour"

function Controls() {
  const { start, isActive, stepIndex } = useTour()
  return (
    <>
      <button onClick={() => start()}>Start</button>
      <button onClick={() => start({ force: true })}>Force</button>
      <span data-testid="state">{isActive ? `active ${stepIndex}` : "idle"}</span>
    </>
  )
}

function Harness({
  steps = STEPS,
  storageKey,
  targets = ["one", "two", "three"],
}: {
  steps?: TourStep[]
  storageKey?: string
  targets?: string[]
}) {
  return (
    <TourProvider steps={steps} storageKey={storageKey}>
      <Controls />
      {targets.map((id) => (
        <div key={id} id={id}>
          {id}
        </div>
      ))}
    </TourProvider>
  )
}

const state = () => screen.getByTestId("state").textContent
const overlay = () => document.querySelector('[data-slot="tour-overlay"]')
const click = (name: RegExp | string) =>
  fireEvent.click(screen.getByRole("button", { name }))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("useTour", () => {
  it("throws outside a TourProvider", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    function Orphan() {
      useTour()
      return null
    }
    expect(() => render(<Orphan />)).toThrow(/TourProvider/)
    error.mockRestore()
  })

  it("reports an inactive tour inside a provider", () => {
    render(<Harness />)
    expect(state()).toBe("idle")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(overlay()).toBeNull()
  })
})

describe("TourProvider", () => {
  it("start() renders the overlay and the first step", () => {
    render(<Harness />)
    click("Start")

    expect(state()).toBe("active 0")
    expect(overlay()).toBeInTheDocument()
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveTextContent("The sidebar")
    expect(dialog).toHaveTextContent("Everything lives here.")
    expect(dialog).toHaveTextContent("Step 1 of 3")
    expect(dialog).toHaveAccessibleName("The sidebar")
  })

  it("Next and Back walk the steps", () => {
    render(<Harness />)
    click("Start")
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()

    click("Next")
    expect(state()).toBe("active 1")
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 2 of 3")

    click("Back")
    expect(state()).toBe("active 0")
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 1 of 3")
  })

  it("shows Done on the last step and stops the tour", () => {
    render(<Harness />)
    click("Start")
    click("Next")
    click("Next")

    expect(screen.getByRole("dialog")).toHaveTextContent("Step 3 of 3")
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()

    click("Done")
    expect(state()).toBe("idle")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(overlay()).toBeNull()
  })

  it("Skip stops the tour", () => {
    render(<Harness />)
    click("Start")
    click("Skip")

    expect(state()).toBe("idle")
    expect(overlay()).toBeNull()
  })

  it("Escape stops the tour", () => {
    render(<Harness />)
    click("Start")
    fireEvent.keyDown(document, { key: "Escape" })

    expect(state()).toBe("idle")
    expect(overlay()).toBeNull()
  })

  it("returns focus to the element that was focused before start()", () => {
    render(<Harness />)
    const trigger = screen.getByRole("button", { name: "Start" })
    trigger.focus()
    fireEvent.click(trigger)

    expect(trigger).not.toHaveFocus()
    click("Skip")
    expect(trigger).toHaveFocus()
  })

  it("moves focus into the step popover on every step", () => {
    render(<Harness />)
    click("Start")
    expect(screen.getByRole("dialog")).toHaveFocus()

    click("Next")
    expect(screen.getByRole("dialog")).toHaveFocus()
  })

  it("skips a step whose target is missing and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Harness targets={["one", "three"]} />)
    click("Start")

    click("Next")
    expect(state()).toBe("active 2")
    expect(screen.getByRole("dialog")).toHaveTextContent("Step 3 of 3")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("#two"))
  })

  it("skips leading missing targets on start()", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Harness targets={["three"]} />)
    click("Start")

    expect(state()).toBe("active 2")
    expect(screen.getByRole("dialog")).toHaveTextContent("Publish")
  })

  it("does not start when no step has a matching target", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Harness targets={[]} />)
    click("Start")

    expect(state()).toBe("idle")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(warn).toHaveBeenCalled()
  })

  it("drops malformed steps instead of throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const steps = [
      null,
      { id: "one", target: "#one", title: "The sidebar", content: "Everything lives here." },
      { id: "one", target: "#two", title: "Duplicate", content: "Dropped." },
      { id: "bad", title: "No target", content: "Dropped." },
    ] as unknown as TourStep[]

    expect(() => render(<Harness steps={steps} />)).not.toThrow()
    click("Start")

    expect(screen.getByRole("dialog")).toHaveTextContent("Step 1 of 1")
    expect(warn).toHaveBeenCalled()
  })

  it("treats an invalid selector as a missing target", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const steps = [{ id: "one", target: "#!!", title: "Nope", content: "Nope." }] as TourStep[]

    expect(() => render(<Harness steps={steps} />)).not.toThrow()
    expect(() => click("Start")).not.toThrow()
    expect(state()).toBe("idle")
  })

  it("scrolls the target into view, smoothly by default", () => {
    const scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {})
    render(<Harness />)
    click("Start")

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "nearest", behavior: "smooth" })
    )
  })

  it("scrolls without animation when reduced motion is preferred", () => {
    const scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {})
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: query.includes("reduced-motion") }))
    )
    render(<Harness />)
    click("Start")

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "nearest", behavior: "auto" })
    )
  })
})

describe("TourProvider storageKey", () => {
  it("records completion on Done and refuses to run again", () => {
    render(<Harness storageKey={KEY} />)
    click("Start")
    click("Next")
    click("Next")
    click("Done")

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ completed: true })

    click("Start")
    expect(state()).toBe("idle")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("runs a completed tour again when forced", () => {
    localStorage.setItem(KEY, JSON.stringify({ completed: true }))
    render(<Harness storageKey={KEY} />)

    click("Start")
    expect(state()).toBe("idle")

    click("Force")
    expect(state()).toBe("active 0")
  })

  it("does not record completion when the tour is skipped", () => {
    render(<Harness storageKey={KEY} />)
    click("Start")
    click("Skip")

    expect(localStorage.getItem(KEY)).toBeNull()
    click("Start")
    expect(state()).toBe("active 0")
  })

  it("runs when the stored payload is corrupt", () => {
    localStorage.setItem(KEY, "{not json")
    render(<Harness storageKey={KEY} />)

    expect(() => click("Start")).not.toThrow()
    expect(state()).toBe("active 0")
  })

  it("runs when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    render(<Harness storageKey={KEY} />)

    expect(() => click("Start")).not.toThrow()
    expect(state()).toBe("active 0")
    expect(() => click("Skip")).not.toThrow()
  })
})

describe("getSpotlightRect", () => {
  it("pads the target rect by 8px on every side", () => {
    expect(getSpotlightRect({ top: 100, left: 50, width: 200, height: 40 })).toEqual({
      x: 42,
      y: 92,
      width: 216,
      height: 56,
    })
  })

  it("never returns a negative origin and keeps the far edge", () => {
    expect(getSpotlightRect({ top: 2, left: 3, width: 10, height: 10 })).toEqual({
      x: 0,
      y: 0,
      width: 21,
      height: 20,
    })
    expect(getSpotlightRect({ top: -50, left: -50, width: 10, height: 10 })).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })

  it("honours a custom padding", () => {
    expect(getSpotlightRect({ top: 10, left: 20, width: 30, height: 40 }, 0)).toEqual({
      x: 20,
      y: 10,
      width: 30,
      height: 40,
    })
  })

  it("rounds to whole pixels", () => {
    const rect = getSpotlightRect({ top: 10.4, left: 10.6, width: 20.5, height: 20.2 })
    expect(Object.values(rect).every(Number.isInteger)).toBe(true)
  })

  it("treats junk as a zero rect and junk padding as the default", () => {
    // A 0x0 rect at the origin, padded and clamped — numbers, never NaN.
    expect(getSpotlightRect({} as DOMRect)).toEqual({ x: 0, y: 0, width: 8, height: 8 })
    expect(
      getSpotlightRect({ top: 10, left: 10, width: 10, height: 10 }, Number.NaN)
    ).toEqual({ x: 2, y: 2, width: 26, height: 26 })
  })
})
