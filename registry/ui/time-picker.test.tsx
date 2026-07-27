import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { TimePicker, TimePickerInput, TimePickerPeriod } from "./time-picker"

const at = (h: number, m: number) => { const d = new Date(2026, 0, 1); d.setHours(h, m, 0, 0); return d }

describe("TimePicker", () => {
  it("renders segment values from value prop (24h)", () => {
    render(
      <TimePicker value={at(9, 30)} onChange={() => {}}>
        <TimePickerInput unit="hours" />
        <TimePickerInput unit="minutes" />
      </TimePicker>
    )
    expect(screen.getByLabelText("Hours")).toHaveValue("09")
    expect(screen.getByLabelText("Minutes")).toHaveValue("30")
  })

  it("ArrowUp increments hours and calls onChange", async () => {
    const onChange = vi.fn()
    render(
      <TimePicker value={at(9, 0)} onChange={onChange}>
        <TimePickerInput unit="hours" />
      </TimePicker>
    )
    await userEvent.type(screen.getByLabelText("Hours"), "{ArrowUp}")
    expect(onChange).toHaveBeenCalled()
    expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(10)
  })

  it("wraps 23h -> 0h on increment", async () => {
    const onChange = vi.fn()
    render(
      <TimePicker value={at(23, 0)} onChange={onChange}>
        <TimePickerInput unit="hours" />
      </TimePicker>
    )
    await userEvent.type(screen.getByLabelText("Hours"), "{ArrowUp}")
    expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(0)
  })

  it("typing digits sets minutes", async () => {
    const onChange = vi.fn()
    render(
      <TimePicker value={at(9, 0)} onChange={onChange}>
        <TimePickerInput unit="minutes" />
      </TimePicker>
    )
    const input = screen.getByLabelText("Minutes")
    await userEvent.type(input, "45")
    const last = onChange.mock.calls.at(-1)![0] as Date
    expect(last.getMinutes()).toBe(45)
  })

  it("12h cycle shows 12 for 0h and toggles period", async () => {
    const onChange = vi.fn()
    render(
      <TimePicker value={at(0, 0)} onChange={onChange} hourCycle={12}>
        <TimePickerInput unit="hours" />
        <TimePickerPeriod />
      </TimePicker>
    )
    expect(screen.getByLabelText("Hours")).toHaveValue("12")
    await userEvent.click(screen.getByRole("button", { name: /AM/i }))
    expect((onChange.mock.calls.at(-1)![0] as Date).getHours()).toBe(12)
  })

  it("uncontrolled with defaultValue works", async () => {
    render(
      <TimePicker defaultValue={at(8, 15)}>
        <TimePickerInput unit="hours" />
      </TimePicker>
    )
    const input = screen.getByLabelText("Hours")
    await userEvent.type(input, "{ArrowUp}")
    expect(input).toHaveValue("09")
  })

  it("error prop sets aria-invalid on all segments and renders an alert", () => {
    render(
      <TimePicker value={at(9, 30)} onChange={() => {}} error="Required">
        <TimePickerInput unit="hours" />
        <TimePickerInput unit="minutes" />
      </TimePicker>
    )
    expect(screen.getByLabelText("Hours")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Minutes")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent("Required")
  })

  it("no error by default", () => {
    render(
      <TimePicker value={at(9, 30)} onChange={() => {}}>
        <TimePickerInput unit="hours" />
      </TimePicker>
    )
    expect(screen.getByLabelText("Hours")).toHaveAttribute("aria-invalid", "false")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
