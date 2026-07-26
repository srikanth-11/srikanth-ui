import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { NumberInput } from "./number-input"

describe("NumberInput", () => {
  it("increments via stepper button and keyboard", async () => {
    const onChange = vi.fn()
    render(<NumberInput defaultValue={5} step={1} onChange={onChange} aria-label="Qty" />)
    await userEvent.click(screen.getByRole("button", { name: /increase/i }))
    expect(onChange).toHaveBeenLastCalledWith(6)
    await userEvent.type(screen.getByLabelText("Qty"), "{ArrowUp}")
    expect(onChange).toHaveBeenLastCalledWith(7)
  })

  it("clamps to min/max", async () => {
    const onChange = vi.fn()
    render(<NumberInput defaultValue={9} max={10} step={5} onChange={onChange} aria-label="Qty" />)
    await userEvent.click(screen.getByRole("button", { name: /increase/i }))
    expect(onChange).toHaveBeenLastCalledWith(10)
    await userEvent.click(screen.getByRole("button", { name: /increase/i }))
    expect(onChange).toHaveBeenLastCalledWith(10)
  })

  it("parses typed input on blur and clamps", async () => {
    const onChange = vi.fn()
    render(<NumberInput min={0} max={100} onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    await userEvent.type(input, "250")
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith(100)
  })

  it("formats display on blur with Intl format", async () => {
    render(
      <NumberInput
        defaultValue={1234.5}
        format={{ style: "currency", currency: "USD" }}
        locale="en-US"
        aria-label="Price"
      />
    )
    expect(screen.getByLabelText("Price")).toHaveValue("$1,234.50")
  })

  it("empty input emits null", async () => {
    const onChange = vi.fn()
    render(<NumberInput defaultValue={5} onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    await userEvent.clear(input)
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
