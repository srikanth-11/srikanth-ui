import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { CopyButton } from "./copy-button"

const writeText = vi.fn(() => Promise.resolve())

beforeEach(() => {
  writeText.mockClear()
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  })
})

describe("CopyButton", () => {
  it("writes its text to the clipboard", () => {
    render(<CopyButton text="npx shadcn@latest add kanban" />)

    fireEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(writeText).toHaveBeenCalledWith("npx shadcn@latest add kanban")
  })

  it("announces the copy in a live region", async () => {
    render(<CopyButton text="const a = 1" />)
    expect(screen.queryByText("Copied")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(await screen.findByText("Copied")).toHaveAttribute("aria-live", "polite")
  })

  it("takes its accessible name from the label", () => {
    render(<CopyButton text="const a = 1" label="Copy install command" />)

    expect(screen.getByRole("button", { name: "Copy install command" })).toBeInTheDocument()
  })
})
