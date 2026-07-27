"use client"
import * as React from "react"
import { NumberInput } from "@/registry/ui/number-input"

export function NumberInputDemo() {
  const [value, setValue] = React.useState<number | null>(1234.5)
  return (
    <div className="w-full max-w-[220px]">
      <NumberInput
        value={value}
        onChange={setValue}
        min={0}
        max={100000}
        step={0.5}
        format={{ style: "currency", currency: "USD" }}
        locale="en-US"
        aria-label="Amount"
      />
    </div>
  )
}

export function NumberInputInvalidDemo() {
  // Type a value outside [0, 100] and blur to see this live — it errors
  // instead of silently clamping, and keeps what you typed so you can fix it.
  return (
    <div className="w-full max-w-[220px]">
      <NumberInput
        defaultValue={250}
        min={0}
        max={100}
        error="Enter a number between 0 and 100"
        aria-label="Quantity"
      />
    </div>
  )
}
