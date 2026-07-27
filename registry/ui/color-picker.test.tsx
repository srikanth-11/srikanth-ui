import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerSwatches,
  hexToHsva,
  hsvaToHex,
} from "./color-picker"

describe("hexToHsva / hsvaToHex round-trip", () => {
  it.each(["#ff0000", "#000000", "#3b82f6"])("round-trips %s exactly", (hex) => {
    const hsva = hexToHsva(hex)
    expect(hsva).not.toBeNull()
    expect(hsvaToHex(hsva!)).toBe(hex)
  })

  it("round-trips 8-digit #3b82f680 with alpha within tolerance", () => {
    const hsva = hexToHsva("#3b82f680")
    expect(hsva).not.toBeNull()
    expect(hsva!.a).toBeCloseTo(0.5, 1)
    expect(hsvaToHex(hsva!)).toBe("#3b82f680")
  })
})

describe("ColorPicker", () => {
  it("renders with defaultValue, uncontrolled: ArrowRight on hue slider fires with no crash", async () => {
    render(
      <ColorPicker defaultValue="#ff0000">
        <ColorPickerHue />
      </ColorPicker>
    )
    const hue = screen.getByRole("slider", { name: "Hue" })
    hue.focus()
    expect(() => fireEvent.keyDown(hue, { key: "ArrowRight" })).not.toThrow()
  })

  it("controlled: value changes propagate via onChange", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" onChange={onChange}>
        <ColorPickerHue />
      </ColorPicker>
    )
    const hue = screen.getByRole("slider", { name: "Hue" })
    hue.focus()
    fireEvent.keyDown(hue, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalled()
  })

  it("hue slider has role=slider and aria-valuenow within 0-360, ArrowRight increments, controlled onChange receives new hex", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" onChange={onChange}>
        <ColorPickerHue />
      </ColorPicker>
    )
    const hue = screen.getByRole("slider", { name: "Hue" })
    expect(hue).toHaveAttribute("aria-valuenow", "0")
    const now = Number(hue.getAttribute("aria-valuenow"))
    expect(now).toBeGreaterThanOrEqual(0)
    expect(now).toBeLessThanOrEqual(360)
    hue.focus()
    fireEvent.keyDown(hue, { key: "ArrowRight" })
    expect(onChange).toHaveBeenCalledTimes(1)
    const nextHex = onChange.mock.calls[0][0] as string
    expect(nextHex).toMatch(/^#[0-9a-f]{6}$/)
    expect(nextHex).not.toBe("#ff0000")
  })

  it("area has role=slider, aria-valuetext contains Saturation, ArrowUp changes brightness and calls onChange", () => {
    const onChange = vi.fn()
    render(
      <ColorPicker value="#808080" onChange={onChange}>
        <ColorPickerArea />
      </ColorPicker>
    )
    const area = screen.getByRole("slider", { name: "Color" })
    expect(area.getAttribute("aria-valuetext")).toContain("Saturation")
    area.focus()
    fireEvent.keyDown(area, { key: "ArrowUp" })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).not.toBe("#808080")
  })

  it("ColorPickerInput: invalid hex reverts on blur without calling onChange", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" onChange={onChange}>
        <ColorPickerInput />
      </ColorPicker>
    )
    const input = screen.getByRole("textbox", { name: "Hex color" }) as HTMLInputElement
    await user.clear(input)
    await user.type(input, "zzz")
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue("#ff0000")
  })

  it("ColorPickerInput: valid hex + Enter commits via onChange", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" onChange={onChange}>
        <ColorPickerInput />
      </ColorPicker>
    )
    const input = screen.getByRole("textbox", { name: "Hex color" }) as HTMLInputElement
    await user.clear(input)
    await user.type(input, "#00ff00{Enter}")
    expect(onChange).toHaveBeenCalledWith("#00ff00")
  })

  it("swatch click calls onChange with that hex, swatch buttons have aria-label", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" onChange={onChange}>
        <ColorPickerSwatches swatches={["#ef4444", "#22c55e"]} />
      </ColorPicker>
    )
    const swatch = screen.getByRole("button", { name: "#22c55e" })
    expect(swatch).toHaveAttribute("aria-label", "#22c55e")
    await user.click(swatch)
    expect(onChange).toHaveBeenCalledWith("#22c55e")
  })

  it("invalid hex commit shows an error message and keeps the previous valid value", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" onChange={onChange}>
        <ColorPickerInput />
      </ColorPicker>
    )
    const input = screen.getByRole("textbox", { name: "Hex color" }) as HTMLInputElement
    await user.clear(input)
    await user.type(input, "zzz{Enter}")
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue("#ff0000")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent(/enter a valid hex color/i)
  })

  it("fixing the hex and committing clears the error", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ColorPicker value="#ff0000" onChange={onChange}>
        <ColorPickerInput />
      </ColorPicker>
    )
    const input = screen.getByRole("textbox", { name: "Hex color" }) as HTMLInputElement
    await user.clear(input)
    await user.type(input, "zzz{Enter}")
    expect(screen.getByRole("alert")).toBeInTheDocument()
    await user.clear(input)
    await user.type(input, "#00ff00{Enter}")
    expect(onChange).toHaveBeenCalledWith("#00ff00")
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("warns in dev when value is set without onChange", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <ColorPicker value="#ff0000">
        <ColorPickerHue />
      </ColorPicker>
    )
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
