import type { ComponentDoc } from "./types"

export const numberInputDoc: ComponentDoc = {
  exports: [
    {
      name: "NumberInput",
      props: [
        {
          name: "value",
          type: "number | null",
          description: "Controlled value; `null` means empty. Pair it with `onChange` or the field is read-only (dev-warned).",
        },
        {
          name: "defaultValue",
          type: "number",
          default: "null (empty)",
          description: "Uncontrolled starting value. Ignored once `value` is provided.",
        },
        {
          name: "onChange",
          type: "(value: number | null) => void",
          description: "Fires with every committed value — steppers, arrow keys and a resolved blur — or `null` when the field is cleared.",
        },
        {
          name: "min",
          type: "number",
          default: "Number.MIN_SAFE_INTEGER",
          description: "Lower bound for the steppers and for the built-in range check.",
        },
        {
          name: "max",
          type: "number",
          default: "Number.MAX_SAFE_INTEGER",
          description: "Upper bound for the steppers and for the built-in range check.",
        },
        {
          name: "step",
          type: "number",
          default: "1",
          description: "Amount each stepper press or arrow key adds or removes.",
        },
        {
          name: "format",
          type: "Intl.NumberFormatOptions",
          description: "Formatting for the resting display, e.g. `{ style: \"currency\", currency: \"EUR\" }`. Editing always shows the raw number.",
        },
        {
          name: "locale",
          type: "string",
          default: "the runtime locale",
          description: "Locale passed to `Intl.NumberFormat` alongside `format`.",
        },
        {
          name: "allowWheel",
          type: "boolean",
          default: "false",
          description: "Lets the mouse wheel step the value while the input is focused (attached as a non-passive listener, so the page does not scroll).",
        },
        {
          name: "error",
          type: "React.ReactNode",
          description: "External error; truthy marks the field invalid and takes precedence over the built-in validation.",
        },
        {
          name: "validate",
          type: "(value: number | null) => React.ReactNode | null",
          description: "Replaces the default out-of-range validator, clamp included. Called on blur with the typed value; an approved value commits exactly as typed.",
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
          name: "clampInput",
          type: "boolean",
          default: "false",
          description: "Legacy behavior: clamp typed out-of-range input into [min, max] on blur instead of showing an error.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Disables the input and both steppers.",
        },
        {
          name: "onFocus",
          type: "React.FocusEventHandler<HTMLInputElement>",
          description: "Forwarded to the input, called after it switches into edit mode.",
        },
        {
          name: "onBlur",
          type: "React.FocusEventHandler<HTMLInputElement>",
          description: "Forwarded to the input, called after the typed text has been validated and committed.",
        },
        {
          name: "onKeyDown",
          type: "React.KeyboardEventHandler<HTMLInputElement>",
          description: "Runs before the built-in arrow handling; call `preventDefault()` in it to suppress stepping.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the row holding the steppers and the input.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Quantity with bounds",
      code: `"use client"

import * as React from "react"
import { NumberInput } from "@/components/ui/number-input"

export function Quantity() {
  const [quantity, setQuantity] = React.useState<number | null>(1)

  return <NumberInput value={quantity} onChange={setQuantity} min={1} max={10} />
}`,
    },
    {
      title: "Formatted currency",
      code: `import { NumberInput } from "@/components/ui/number-input"

export function Budget() {
  return (
    <NumberInput
      defaultValue={2500}
      min={0}
      step={100}
      allowWheel
      locale="de-DE"
      format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
    />
  )
}`,
    },
    {
      title: "Custom validation",
      code: `"use client"

import * as React from "react"
import { NumberInput } from "@/components/ui/number-input"

export function EvenOnly() {
  const [value, setValue] = React.useState<number | null>(null)

  return (
    <NumberInput
      value={value}
      onChange={setValue}
      validate={(next) => (next !== null && next % 2 !== 0 ? "Use an even number" : null)}
    />
  )
}`,
    },
  ],
  errorState:
    "Typed text is validated on blur. By default a number outside [min, max] is rejected rather than silently corrected: the field shows \"Enter a number between {min} and {max}\" (both formatted with your `locale`/`format`), keeps the text on screen so it can be fixed, and commits nothing. Set `clampInput` to get the older behavior instead — the value is clamped into range and committed. Text that parses to no number at all (empty, `-`, letters) commits as `null`, which is not an error. Passing `validate` replaces the default validator entirely, clamp included, so a value it approves commits exactly as typed, in range or not. Every path that resolves to a value — stepper press, arrow key, an accepted blur — clears the error, so a stale message can never outlive the input that caused it. A truthy `error` prop marks the field invalid too and takes precedence over the internal result. Either way the input carries `aria-invalid` and the message renders in a `role=\"alert\"` paragraph wired up with `aria-describedby`; `onErrorChange` reports internal errors as they appear and clear.",
}
