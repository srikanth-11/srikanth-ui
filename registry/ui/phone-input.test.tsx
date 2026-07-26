import { render, screen } from "@testing-library/react"
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

  it("re-exports isValidPhoneNumber", () => {
    expect(isValidPhoneNumber("+12025550123")).toBe(true)
    expect(isValidPhoneNumber("+1202")).toBe(false)
  })
})
