import type { ComponentDoc } from "./types"

export const phoneInputDoc: ComponentDoc = {
  exports: [
    {
      name: "PhoneInput",
      props: [
        {
          name: "value",
          type: "string",
          description: "Controlled value in E.164 (`+14155550123`); the country is re-derived from it as it changes. Pair it with `onChange` or the field is read-only (dev-warned).",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "Uncontrolled initial value, E.164. Ignored if `value` is provided.",
        },
        {
          name: "defaultCountry",
          type: "CountryCode",
          default: '"US"',
          description: "Country the field starts on when no value parses to one.",
        },
        {
          name: "onChange",
          type: "(e164: string) => void",
          description: "Fires with the E.164 value on every edit — partial numbers included, and `\"\"` when empty — so it can be fed straight back into `value`.",
        },
        {
          name: "onCountryChange",
          type: "(country: CountryCode) => void",
          description: "Fires when the country changes, whether picked from the list or derived from a pasted international number.",
        },
        {
          name: "error",
          type: "React.ReactNode",
          description: "External error; truthy marks the field invalid and takes precedence over the built-in validation.",
        },
        {
          name: "validate",
          type: "(value: string) => React.ReactNode | null",
          description: "Replaces the default validator entirely. Called on blur with the current E.164 value; return a message or null.",
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
          description: "Disables both the country trigger and the number input.",
        },
        {
          name: "onBlur",
          type: "React.FocusEventHandler<HTMLInputElement>",
          description: "Forwarded to the number input, called after validation has run.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the row wrapping the country button and the input.",
        },
      ],
    },
    {
      name: "isValidPhoneNumber",
      props: [
        {
          name: "text",
          type: "string",
          description: "The number to check — an E.164 string validates on its own.",
        },
        {
          name: "defaultCountry",
          type: "CountryCode | { defaultCountry?: CountryCode, defaultCallingCode?: string }",
          description: "Optional country used to interpret a national-format number. Re-exported straight from `libphonenumber-js/min` so form-level validation needs no extra import.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Uncontrolled with a starting country",
      code: `import { PhoneInput } from "@/components/ui/phone-input"

export function ContactField() {
  return <PhoneInput defaultCountry="GB" defaultValue="+442071234567" />
}`,
    },
    {
      title: "Controlled, submitting E.164",
      code: `"use client"

import * as React from "react"
import { isValidPhoneNumber, PhoneInput } from "@/components/ui/phone-input"

export function SignUpPhone() {
  const [phone, setPhone] = React.useState("")

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        console.log(phone) // "+14155550123"
      }}
    >
      <PhoneInput value={phone} onChange={setPhone} />
      <button type="submit" disabled={!isValidPhoneNumber(phone)}>
        Continue
      </button>
    </form>
  )
}`,
    },
    {
      title: "Custom validation",
      code: `"use client"

import * as React from "react"
import { PhoneInput } from "@/components/ui/phone-input"

export function UsOnlyPhone() {
  const [phone, setPhone] = React.useState("")

  return (
    <PhoneInput
      value={phone}
      onChange={setPhone}
      validate={(e164) => (e164.startsWith("+1") ? null : "US numbers only")}
    />
  )
}`,
    },
  ],
  errorState:
    "With no `validate` prop the field runs two built-in checks. Too-long is checked on every keystroke — it is the one violation typing more can never fix — and reports \"Phone number is too long for <Country>\" once the digits pass the country's length or grow past the length at which the number last parsed as valid. Everything else is checked on blur: a non-empty number that fails `isValidPhoneNumber` reports \"Enter a valid <Country> phone number\". Passing `validate` replaces both; it runs on blur with the current E.164 string. Picking a different country clears any error, drops the length bookkeeping and re-checks against the new one. A truthy `error` prop takes precedence over whatever the internal validation found, and passing `error` at all (even `null`) hands the message over to you. Any error sets `aria-invalid` on the number input and renders a `role=\"alert\"` message below the row; `onErrorChange` fires only for the internal error, as it appears and clears.",
}
