import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PasswordInput, PasswordStrength, defaultPasswordRules } from "./password-input"

describe("PasswordInput", () => {
  it("hides text by default, toggle reveals", async () => {
    render(<PasswordInput aria-label="Password" />)
    const input = screen.getByLabelText("Password")
    expect(input).toHaveAttribute("type", "password")
    const toggle = screen.getByRole("button", { name: /show password/i })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(toggle)
    expect(input).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: /hide password/i })).toHaveAttribute("aria-pressed", "true")
  })

  it("disabled propagates to the visibility toggle", async () => {
    render(<PasswordInput aria-label="Password" disabled />)
    const input = screen.getByLabelText("Password")
    expect(input).toBeDisabled()
    const toggle = screen.getByRole("button", { name: /show password/i })
    expect(toggle).toBeDisabled()
    await userEvent.click(toggle)
    expect(input).toHaveAttribute("type", "password")
  })
})

describe("PasswordStrength", () => {
  it("shows all default rules unmet for empty password", () => {
    render(<PasswordStrength value="" />)
    for (const rule of defaultPasswordRules) {
      expect(screen.getByText(rule.label)).toHaveAttribute("data-met", "false")
    }
  })

  it("marks met rules and fills meter", () => {
    render(<PasswordStrength value="Abcdef1!" />)
    for (const rule of defaultPasswordRules) {
      expect(screen.getByText(rule.label)).toHaveAttribute("data-met", "true")
    }
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100")
  })

  it("custom getScore overrides heuristic", () => {
    render(<PasswordStrength value="anything" getScore={() => 0.5} />)
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "50")
  })

  it("rules=[] does not produce NaN", () => {
    render(<PasswordStrength value="x" rules={[]} />)
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0")
  })
})
