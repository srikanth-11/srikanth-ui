import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PhoneInput, isValidPhoneNumber } from "./phone-input"

describe("PhoneInput", () => {
  it("formats national number as you type and emits E.164", async () => {
    const onChange = vi.fn()
    render(<PhoneInput defaultCountry="US" onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    await userEvent.type(input, "2025550123")
    expect(onChange).toHaveBeenLastCalledWith("+12025550123")
    expect((input as HTMLInputElement).value).toMatch(/\(202\) 555-0123/)
  })

  it("strips non-digits", async () => {
    const onChange = vi.fn()
    render(<PhoneInput defaultCountry="US" onChange={onChange} />)
    await userEvent.type(screen.getByRole("textbox", { name: /phone number/i }), "202-555a0123")
    expect(onChange).toHaveBeenLastCalledWith("+12025550123")
  })

  it("switching country updates dial code and calls onCountryChange", async () => {
    const onCountryChange = vi.fn()
    render(<PhoneInput defaultCountry="US" onCountryChange={onCountryChange} />)
    await userEvent.click(screen.getByRole("combobox", { name: /select country/i }))
    await userEvent.type(screen.getByPlaceholderText(/search country/i), "India")
    const indianOption = await screen.findByText("India")
    await userEvent.click(indianOption)
    expect(onCountryChange).toHaveBeenCalledWith("IN")
  })

  it("pasting a full international number emits correct E.164, not a doubled calling code", async () => {
    const onChange = vi.fn()
    render(<PhoneInput defaultCountry="US" onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    await userEvent.click(input)
    fireEvent.change(input, { target: { value: "+1 202 555 0123" } })
    expect(onChange).toHaveBeenLastCalledWith("+12025550123")
  })

  it("defaultValue renders national format without calling onChange", () => {
    const onChange = vi.fn()
    render(<PhoneInput defaultValue="+12025550123" onChange={onChange} />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    expect((input as HTMLInputElement).value).toMatch(/\(202\) 555-0123/)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("disabled propagates to the country trigger and blocks it opening", async () => {
    render(<PhoneInput disabled />)
    expect(screen.getByRole("textbox", { name: /phone number/i })).toBeDisabled()
    const trigger = screen.getByRole("combobox", { name: /select country/i })
    expect(trigger).toBeDisabled()
    await userEvent.click(trigger)
    expect(screen.queryByPlaceholderText(/search country/i)).not.toBeInTheDocument()
  })

  it("re-exports isValidPhoneNumber", () => {
    expect(isValidPhoneNumber("+12025550123")).toBe(true)
    expect(isValidPhoneNumber("+1202")).toBe(false)
  })

  it("controlled: typed digits appear and round-trip through value", async () => {
    function Harness() {
      const [v, setV] = React.useState("")
      return <PhoneInput value={v} onChange={setV} defaultCountry="US" />
    }
    render(<Harness />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    await userEvent.type(input, "202")
    expect((input as HTMLInputElement).value).not.toBe("")
    await userEvent.type(input, "5550123")
    expect((input as HTMLInputElement).value).toMatch(/\(202\) 555-0123/)
  })

  it("typing past a previously-valid IN number shows an immediate too-long error, which clears once fixed", async () => {
    const onErrorChange = vi.fn()
    render(<PhoneInput defaultCountry="IN" onErrorChange={onErrorChange} />)
    const input = screen.getByRole("textbox", { name: /phone number/i })

    // 10 digits is a complete, valid IN number — no error, no blur needed.
    await userEvent.type(input, "9876543210")
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    // 11th digit: was valid, appending made it invalid — immediate too-long error.
    await userEvent.type(input, "9")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent(/too long/i)
    expect(onErrorChange).toHaveBeenCalledWith(expect.stringMatching(/too long/i))

    // Delete back down to the valid 10-digit number — clears immediately, no blur.
    await userEvent.type(input, "{Backspace}")
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(onErrorChange).toHaveBeenLastCalledWith(null)
  })

  it("TOO_LONG-length numbers (14+ digits for IN) also trigger the immediate error", async () => {
    render(<PhoneInput defaultCountry="IN" />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    // 14 digits is TOO_LONG for IN per libphonenumber-js metadata, independent of
    // whether a shorter prefix was ever valid.
    await userEvent.type(input, "99999999999999")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent(/too long/i)
  })

  it("blur with an incomplete number shows an error; blur with a valid number shows none", async () => {
    render(<PhoneInput defaultCountry="IN" />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    await userEvent.type(input, "98765")
    await userEvent.tab()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent(/enter a valid/i)

    await userEvent.click(input)
    await userEvent.type(input, "43210")
    await userEvent.tab()
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("switching country drops the previous country's too-long error", async () => {
    render(<PhoneInput defaultCountry="IN" />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    await userEvent.type(input, "98765432109") // 11 digits: too long for IN
    expect(screen.getByRole("alert")).toHaveTextContent(/too long for India/i)

    await userEvent.click(screen.getByRole("combobox", { name: /select country/i }))
    await userEvent.type(screen.getByPlaceholderText(/search country/i), "United States")
    await userEvent.click(await screen.findByText("United States"))

    // Re-evaluated for the new country — whatever shows must not mention India.
    expect(screen.queryByText(/India/i)).not.toBeInTheDocument()

    // And blur is no longer wedged by the stale too-long flag.
    await userEvent.click(input)
    await userEvent.tab()
    expect(screen.queryByText(/India/i)).not.toBeInTheDocument()
  })

  it("error prop displays a custom message, sets aria-invalid and describes the input by it", () => {
    const { rerender } = render(<PhoneInput defaultCountry="US" error="custom" />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    expect(input).toHaveAttribute("aria-invalid", "true")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("custom")
    expect(alert.id).toBeTruthy()
    expect(input.getAttribute("aria-describedby")).toBe(alert.id)

    rerender(<PhoneInput defaultCountry="US" error="custom" showErrorMessage={false} />)
    const quiet = screen.getByRole("textbox", { name: /phone number/i })
    expect(quiet).toHaveAttribute("aria-invalid", "true")
    // No message rendered, so nothing to point aria-describedby at.
    expect(quiet).not.toHaveAttribute("aria-describedby")
  })

  it("keeps a consumer aria-describedby alongside the error id", () => {
    render(<PhoneInput defaultCountry="US" error="custom" aria-describedby="hint" />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    const alert = screen.getByRole("alert")
    expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual(
      expect.arrayContaining(["hint", alert.id])
    )
  })

  it("no error by default: no alert and nothing described", () => {
    render(<PhoneInput defaultCountry="US" />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(input).not.toHaveAttribute("aria-describedby")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("validate prop replaces the default validator", async () => {
    render(<PhoneInput defaultCountry="US" validate={() => "always wrong"} />)
    const input = screen.getByRole("textbox", { name: /phone number/i })
    await userEvent.type(input, "2025550123") // a fully valid US number
    await userEvent.tab()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent("always wrong")
  })
})
