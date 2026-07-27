"use client"
import * as React from "react"
import { PhoneInput } from "@/registry/ui/phone-input"

export function PhoneInputDemo() {
  const [value, setValue] = React.useState("")
  return (
    <div className="w-full max-w-sm space-y-2">
      <PhoneInput defaultCountry="US" onChange={setValue} />
      <p className="text-muted-foreground font-mono text-xs">{value || "E.164 output"}</p>
    </div>
  )
}

export function PhoneInputInvalidDemo() {
  // Forces the same message the default validator shows live once you type
  // more digits than India's numbers can hold — no interaction needed to see it.
  return (
    <div className="w-full max-w-sm">
      <PhoneInput
        defaultCountry="IN"
        defaultValue="+919999999999999"
        error="Phone number is too long for India"
      />
    </div>
  )
}
