import { fireEvent, render, screen } from "@testing-library/react"
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

  it("typed out-of-range input on blur shows an error and does not clamp or commit", async () => {
    const onChange = vi.fn()
    render(<NumberInput min={0} max={100} onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    await userEvent.type(input, "250")
    await userEvent.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent(/between/i)
    expect(input).toHaveValue("250")
  })

  it("clampInput restores the legacy clamp-on-blur behavior", async () => {
    const onChange = vi.fn()
    render(<NumberInput min={0} max={100} clampInput onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    await userEvent.type(input, "250")
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith(100)
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("showErrorMessage=false hides the alert but keeps aria-invalid", async () => {
    const onChange = vi.fn()
    render(<NumberInput min={0} max={100} showErrorMessage={false} onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    await userEvent.type(input, "250")
    await userEvent.tab()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("correcting via a stepper after a blur error clears the stale error and display", async () => {
    const onChange = vi.fn()
    render(<NumberInput min={0} max={100} onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    await userEvent.type(input, "250")
    await userEvent.tab()
    expect(screen.getByRole("alert")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /decrease/i }))
    expect(onChange).toHaveBeenLastCalledWith(0)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(input).toHaveValue("0")
  })

  it("validate fully replaces the default validator — an approved out-of-range value is not clamped", async () => {
    const onChange = vi.fn()
    render(
      <NumberInput min={0} max={100} validate={() => null} onChange={onChange} aria-label="Qty" />
    )
    const input = screen.getByLabelText("Qty")
    await userEvent.type(input, "250")
    await userEvent.tab()
    expect(onChange).toHaveBeenLastCalledWith(250)
    expect(input).toHaveAttribute("aria-invalid", "false")
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

  it("disabled propagates to the steppers", async () => {
    const onChange = vi.fn()
    render(<NumberInput defaultValue={5} disabled onChange={onChange} aria-label="Qty" />)
    expect(screen.getByLabelText("Qty")).toBeDisabled()
    expect(screen.getByRole("button", { name: /increase/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /decrease/i })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: /increase/i }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("wheel steps value when allowWheel and focused, via a non-passive listener", () => {
    const onChange = vi.fn()
    render(<NumberInput defaultValue={5} step={1} allowWheel onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    input.focus()
    fireEvent.wheel(input, { deltaY: -100 })
    expect(onChange).toHaveBeenLastCalledWith(6)
  })

  it("wheel does nothing when allowWheel is false", () => {
    const onChange = vi.fn()
    render(<NumberInput defaultValue={5} step={1} onChange={onChange} aria-label="Qty" />)
    const input = screen.getByLabelText("Qty")
    input.focus()
    fireEvent.wheel(input, { deltaY: -100 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("hold-to-repeat steps repeatedly while held", () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<NumberInput defaultValue={5} step={1} onChange={onChange} aria-label="Qty" />)
    fireEvent.pointerDown(screen.getByRole("button", { name: /increase/i }))
    vi.advanceTimersByTime(1000)
    fireEvent.pointerUp(screen.getByRole("button", { name: /increase/i }))
    vi.useRealTimers()
    const values = onChange.mock.calls.map((c) => c[0])
    expect(values[0]).toBe(6)
    expect(Math.max(...values)).toBeGreaterThan(6)
  })
})
