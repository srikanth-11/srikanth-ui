import type { ComponentDoc } from "./types"

export const timePickerDoc: ComponentDoc = {
  exports: [
    {
      name: "TimePicker",
      props: [
        {
          name: "value",
          type: "Date",
          description: "Controlled time. Pass it with `onChange` or the segments render read-only (dev-warned).",
        },
        {
          name: "defaultValue",
          type: "Date",
          default: "today at 00:00:00",
          description: "Uncontrolled starting time. Ignored once `value` is provided.",
        },
        {
          name: "onChange",
          type: "(date: Date) => void",
          description: "Fires with the new Date whenever a segment or the AM/PM toggle changes.",
        },
        {
          name: "hourCycle",
          type: "12 | 24",
          default: "24",
          description: "Hour format. 12 also enables `TimePickerPeriod`.",
        },
        {
          name: "error",
          type: "React.ReactNode",
          description: "External error. Segments cannot produce invalid times themselves, so pass a truthy value here to mark every one of them invalid.",
        },
        {
          name: "showErrorMessage",
          type: "boolean",
          default: "true",
          description: "Set false to keep the invalid styling but render the message yourself.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the `role=\"group\"` row that wraps the segments.",
        },
        {
          name: "children",
          type: "React.ReactNode",
          description: "The segment parts to render. You compose the hour/minute/second inputs and separators.",
        },
      ],
    },
    {
      name: "TimePickerInput",
      props: [
        {
          name: "unit",
          type: '"hours" | "minutes" | "seconds"',
          description: "Which part of the time this segment edits. Required.",
        },
        {
          name: "onKeyDown",
          type: "React.KeyboardEventHandler<HTMLInputElement>",
          description: "Runs before the built-in key handling. Call `preventDefault()` in it to suppress the arrow/digit behavior.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the segment input.",
        },
      ],
    },
    {
      name: "TimePickerPeriod",
      props: [
        {
          name: "className",
          type: "string",
          description: "Extra classes for the AM/PM toggle button. Every other `Button` prop is forwarded, and the part renders nothing unless `hourCycle` is 12.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "24-hour time",
      code: `import { TimePicker, TimePickerInput } from "@/components/ui/time-picker"

export function MeetingTime() {
  return (
    <TimePicker defaultValue={new Date()} onChange={(date) => console.log(date)}>
      <TimePickerInput unit="hours" />
      <span className="text-muted-foreground">:</span>
      <TimePickerInput unit="minutes" />
    </TimePicker>
  )
}`,
    },
    {
      title: "12-hour with AM/PM",
      code: `"use client"

import * as React from "react"
import { TimePicker, TimePickerInput, TimePickerPeriod } from "@/components/ui/time-picker"

export function AlarmTime() {
  const [time, setTime] = React.useState(new Date())

  return (
    <TimePicker value={time} onChange={setTime} hourCycle={12}>
      <TimePickerInput unit="hours" />
      <span className="text-muted-foreground">:</span>
      <TimePickerInput unit="minutes" />
      <TimePickerPeriod />
    </TimePicker>
  )
}`,
    },
  ],
  errorState:
    "A segment can never hold an invalid time, so `error` is the only way the field goes invalid. Typed digits above the unit's maximum restart the buffer, and arrow keys wrap. A truthy `error` sets `aria-invalid` on every segment input and on the AM/PM button (destructive border and ring) and renders the message in a `role=\"alert\"` paragraph below the group. Each segment points its `aria-describedby` at that message, so the error is announced no matter which segment has focus. With `showErrorMessage={false}` the invalid styling stays, the message is not rendered, and `aria-describedby` is left off. Render and associate your own text in that case.",
}
