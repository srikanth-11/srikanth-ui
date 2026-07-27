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

export function TimePickerInvalidDemo() {
  // Segments can't produce an invalid time — invalid is always the app's call,
  // passed in through `error` (aria-invalid lands on every segment).
  return (
    <TimePicker
      defaultValue={new Date(2026, 0, 1, 3, 15)}
      hourCycle={12}
      error="Select a time within business hours"
    >
      <TimePickerInput unit="hours" />
      <span className="text-muted-foreground">:</span>
      <TimePickerInput unit="minutes" />
      <TimePickerPeriod />
    </TimePicker>
  )
}
