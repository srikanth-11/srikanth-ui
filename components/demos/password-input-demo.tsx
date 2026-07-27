"use client"
import * as React from "react"
import { PasswordInput, PasswordStrength } from "@/registry/ui/password-input"

export function PasswordInputDemo() {
  const [pw, setPw] = React.useState("")
  return (
    <div className="w-full max-w-sm space-y-3">
      <PasswordInput placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
      <PasswordStrength value={pw} />
    </div>
  )
}

export function PasswordInputInvalidDemo() {
  // No default validator — password policy is app-specific, so the app passes
  // `error` (or a `validate` fn) and the field renders the invalid styling.
  return (
    <div className="w-full max-w-sm">
      <PasswordInput placeholder="Password" error="Password is required" />
    </div>
  )
}
