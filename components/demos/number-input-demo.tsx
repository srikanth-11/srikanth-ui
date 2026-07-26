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
