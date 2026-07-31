import type { ComponentDoc } from "./types"

export const passwordInputDoc: ComponentDoc = {
  exports: [
    {
      name: "PasswordInput",
      props: [
        {
          name: "error",
          type: "React.ReactNode",
          description: "External error. Passing it at all — even `null` — takes precedence over `validate`'s result; a truthy value marks the field invalid.",
        },
        {
          name: "validate",
          type: "(value: string) => React.ReactNode | null",
          description: "Called on blur with the current value; return a message or null. There is no default policy — password rules are app-specific.",
        },
        {
          name: "onErrorChange",
          type: "(error: React.ReactNode | null) => void",
          description: "Fires when the internal validation error appears or clears.",
        },
        {
          name: "showErrorMessage",
          type: "boolean",
          default: "true",
          description: "Set false to keep the invalid styling but render the message yourself.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables both the input and the show/hide toggle.",
        },
        {
          name: "onBlur",
          type: "React.FocusEventHandler<HTMLInputElement>",
          description: "Forwarded to the input, called after `validate` has run.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the input; it keeps the end padding that makes room for the toggle. Every other `Input` prop — `name`, `value`, `onChange`, `placeholder`, `autoComplete`, … — is forwarded.",
        },
      ],
    },
    {
      name: "PasswordStrength",
      props: [
        {
          name: "value",
          type: "string",
          description: "The password to measure. Required — this part is presentational and holds no state.",
        },
        {
          name: "rules",
          type: "PasswordRule[]",
          default: "defaultPasswordRules",
          description: "Checklist rendered under the meter; each rule is `{ label, test }`. The built-in set covers length, mixed case, a number and a symbol.",
        },
        {
          name: "getScore",
          type: "(pw: string) => number",
          default: "fraction of rules met",
          description: "Return 0–1 to drive the meter from your own estimator (zxcvbn, a server score, …).",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the meter + checklist wrapper.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "With the strength meter",
      code: `"use client"

import * as React from "react"
import { PasswordInput, PasswordStrength } from "@/components/ui/password-input"

export function NewPasswordField() {
  const [password, setPassword] = React.useState("")

  return (
    <div className="space-y-2">
      <PasswordInput
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New password"
        autoComplete="new-password"
      />
      <PasswordStrength value={password} />
    </div>
  )
}`,
    },
    {
      title: "Validate on blur",
      code: `import { PasswordInput } from "@/components/ui/password-input"

export function SignInPassword() {
  return (
    <PasswordInput
      name="password"
      autoComplete="current-password"
      validate={(value) => (value.length < 8 ? "At least 8 characters" : null)}
    />
  )
}`,
    },
    {
      title: "Custom rules",
      code: `"use client"

import * as React from "react"
import { PasswordStrength, type PasswordRule } from "@/components/ui/password-input"

const rules: PasswordRule[] = [
  { label: "At least 12 characters", test: (pw) => pw.length >= 12 },
  { label: "Contains a digit", test: (pw) => /\\d/.test(pw) },
]

export function Strength({ password }: { password: string }) {
  return <PasswordStrength value={password} rules={rules} />
}`,
    },
  ],
  errorState:
    "The field ships no password policy of its own: nothing is invalid until `validate` says so. It runs on blur with the current value, and whatever it returns becomes the message. A truthy `error` prop marks the field invalid too, and passing `error` at all (even `null`) takes precedence over the internal result — that is how a server-side or form-library error replaces the local one. Either way the input gets `aria-invalid`, the message renders in a `role=\"alert\"` paragraph below and `aria-describedby` links the two; `showErrorMessage={false}` keeps the styling and drops the rendered message. `onErrorChange` fires only for the internal error, as it appears and clears. `PasswordStrength` is purely informative — an unmet rule is never an error state.",
}
