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
