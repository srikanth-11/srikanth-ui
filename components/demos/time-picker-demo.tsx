"use client"
import * as React from "react"
import { TimePicker, TimePickerInput, TimePickerPeriod } from "@/registry/ui/time-picker"

export function TimePickerDemo() {
  const [date, setDate] = React.useState<Date>(() => new Date(new Date().setHours(9, 30, 0, 0)))
  return (
    <TimePicker value={date} onChange={setDate} hourCycle={12}>
      <TimePickerInput unit="hours" />
      <span className="text-muted-foreground">:</span>
      <TimePickerInput unit="minutes" />
      <TimePickerPeriod />
    </TimePicker>
  )
}
